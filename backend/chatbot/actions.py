"""
chatbot/actions.py
-------------------
Backend action functions — each maps 1:1 to an intent.
Each function accepts structured entities + the authenticated user_id,
performs a real DB operation, and returns a human-readable string response.
"""

import uuid
from decimal import Decimal
from database import db
from models.customer import Customer
from models.item import Item
from models.bill import Bill, BillItem
from models.payment import Payment


# ─────────────────────────────────────────────────────────────────────────────
# CREATE_CUSTOMER
# ─────────────────────────────────────────────────────────────────────────────
def action_create_customer(entities: dict, user_id: str) -> str:
    name  = entities.get("customer")
    phone = entities.get("phone")
    email = entities.get("email")

    if not name:
        return "I couldn't find a customer name. Please say: 'add customer Ravi 9876543210'."
    if not phone or len(phone) != 10:
        return f"Please provide a valid 10-digit phone number for {name}."

    existing = Customer.query.filter_by(phone=phone, user_id=user_id).first()
    if existing:
        return f"A customer with phone {phone} already exists as '{existing.name}'."

    customer = Customer(
        id=str(uuid.uuid4()),
        name=name,
        phone=phone,
        email=email,
        user_id=user_id,
    )
    db.session.add(customer)
    db.session.commit()

    msg = f"Customer '{name}' added successfully with phone {phone}"
    if email:
        msg += f" and email {email}"
    msg += "."
    return msg


# ─────────────────────────────────────────────────────────────────────────────
# CREATE_BILL
# ─────────────────────────────────────────────────────────────────────────────
def action_create_bill(entities: dict, user_id: str) -> str:
    customer_name = entities.get("customer")
    items_list    = entities.get("items", [])

    if not customer_name:
        return "I need a customer name to create a bill. E.g. 'bill for Ravi 2 shoes 3 shirts'."
    if not items_list:
        return "I couldn't identify any items. Please mention item names and quantities."

    # Fuzzy customer lookup (case-insensitive partial match)
    customer = Customer.query.filter(
        Customer.user_id == user_id,
        Customer.name.ilike(f"%{customer_name}%")
    ).first()

    if not customer:
        return (
            f"Customer '{customer_name}' not found. "
            f"Add them first: 'add customer {customer_name} <phone>'"
        )

    bill_id     = str(uuid.uuid4())
    total_amount = 0.0
    bill_items  = []
    not_found   = []

    for entry in items_list:
        item_name = entry["item"]
        qty       = entry["qty"]

        item = Item.query.filter(
            Item.user_id == user_id,
            Item.name.ilike(f"%{item_name}%"),
            Item.is_active == True
        ).first()

        if not item:
            not_found.append(item_name)
            continue

        if item.stock_quantity < qty:
            return (
                f"Insufficient stock for '{item.name}'. "
                f"Available: {item.stock_quantity}, Requested: {qty}."
            )

        item_total = float(item.price) * qty
        total_amount += item_total

        bill_items.append(BillItem(
            id=str(uuid.uuid4()),
            bill_id=bill_id,
            item_id=item.id,
            quantity=qty,
            price_at_purchase=item.price,
            total_price=item_total,
        ))
        item.stock_quantity -= qty

    if not bill_items:
        missing = ", ".join(not_found)
        return f"None of the items were found in inventory: {missing}. Please check item names."

    new_bill = Bill(
        id=bill_id,
        customer_id=customer.id,
        total_amount=total_amount,
        discount_amount=0,
        final_amount=total_amount,
        paid_amount=total_amount,   # Fully paid
        due_amount=0,               # No dues
        status="paid",
        user_id=user_id,
    )

    customer.total_purchases += Decimal(str(total_amount))
    # We do NOT increase outstanding_due since it's fully paid.

    db.session.add(new_bill)
    for bi in bill_items:
        db.session.add(bi)
        
    # Create the payment record so it shows up in the Payments section
    payment = Payment(
        id=str(uuid.uuid4()),
        bill_id=bill_id,
        customer_id=customer.id,
        amount=total_amount,
        balance_before=total_amount,
        balance_after=0,
        user_id=user_id,
        payment_mode="Cash"
    )
    db.session.add(payment)
    
    db.session.commit()
    db.session.refresh(new_bill)

    # Trigger Email
    from utils.email_utils import send_bill_email
    try:
        send_bill_email(new_bill.id)
    except Exception as e:
        print(f"CHATBOT EMAIL ERROR (Bill): {e}")

    item_summary = ", ".join(
        f"{e['qty']}x {e['item']}" for e in items_list
        if not any(nf.lower() in e["item"].lower() for nf in not_found)
    )
    warn = f" (Items not found: {', '.join(not_found)})" if not_found else ""
    return (
        f"Bill #{new_bill.bill_number} created and marked as PAID for {customer.name} "
        f"— {item_summary} — Total: Rs.{total_amount:.0f}{warn}."
    )


# ─────────────────────────────────────────────────────────────────────────────
# COLLECT_PAYMENT
# ─────────────────────────────────────────────────────────────────────────────
def action_collect_payment(entities: dict, user_id: str) -> str:
    customer_name = entities.get("customer")
    amount        = entities.get("amount")

    if not customer_name:
        return "Please specify the customer name. E.g. 'collected 500 from Ravi'."
    if amount is None or amount <= 0:
        return "Please specify a valid payment amount."

    customer = Customer.query.filter(
        Customer.user_id == user_id,
        Customer.name.ilike(f"%{customer_name}%")
    ).first()

    if not customer:
        return f"Customer '{customer_name}' not found."

    if float(customer.outstanding_due) <= 0:
        return f"{customer.name} has no outstanding dues."

    # Apply against oldest unpaid bills first
    remaining = Decimal(str(amount))
    applied   = Decimal("0")

    bills = Bill.query.filter(
        Bill.customer_id == customer.id,
        Bill.user_id == user_id,
        Bill.due_amount > 0,
    ).order_by(Bill.created_at.asc()).all()

    for bill in bills:
        if remaining <= 0:
            break
        old_due = bill.due_amount
        if remaining >= bill.due_amount:
            applied   += bill.due_amount
            remaining -= bill.due_amount
            bill.paid_amount += bill.due_amount
            bill.due_amount   = Decimal("0")
            bill.status       = "paid"
        else:
            applied            += remaining
            bill.paid_amount   += remaining
            bill.due_amount    -= remaining
            bill.status         = "partial"
            remaining           = Decimal("0")

        payment = Payment(
            id=str(uuid.uuid4()),
            bill_id=bill.id,
            customer_id=customer.id,
            amount=float(applied),
            balance_before=float(old_due),
            balance_after=float(bill.due_amount),
            user_id=user_id,
            payment_mode="Cash",
        )
        db.session.add(payment)

    customer.outstanding_due -= applied
    if customer.outstanding_due < 0:
        customer.outstanding_due = Decimal("0")

    db.session.commit()

    # Trigger Email(s) for the payment(s)
    from utils.email_utils import send_payment_email
    # Since one collection might pay multiple bills, we just send one general receipt if possible?
    # Actually, let's just trigger the last payment's receipt or the first one.
    # The utils.send_payment_email takes a single payment_id.
    if 'payment' in locals():
        try:
            send_payment_email(payment.id)
        except Exception as e:
            print(f"CHATBOT EMAIL ERROR (Payment): {e}")

    remaining_due = float(customer.outstanding_due)
    msg = f"Collected Rs.{float(applied):.0f} from {customer.name}."
    if remaining_due > 0:
        msg += f" Remaining due: Rs.{remaining_due:.0f}."
    else:
        msg += " All dues cleared!"
    return msg


# ─────────────────────────────────────────────────────────────────────────────
# QUERY_CUSTOMER
# ─────────────────────────────────────────────────────────────────────────────
def action_query_customer(entities: dict, user_id: str) -> str:
    customer_name = entities.get("customer")

    if not customer_name:
        return "Please mention the customer name. E.g. 'show details of Ravi'."

    customer = Customer.query.filter(
        Customer.user_id == user_id,
        Customer.name.ilike(f"%{customer_name}%")
    ).first()

    if not customer:
        return f"No customer found matching '{customer_name}'."

    due     = float(customer.outstanding_due)
    spent   = float(customer.total_purchases)
    phone   = customer.phone
    email   = customer.email or "—"
    last_p  = customer.last_purchase_date.strftime("%d %b %Y") if customer.last_purchase_date else "No purchases yet"

    return (
        f"Customer: {customer.name}\n"
        f"Phone: {phone} | Email: {email}\n"
        f"Total Purchases: Rs.{spent:.0f} | Outstanding Due: Rs.{due:.0f}\n"
        f"Last Purchase: {last_p}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# QUERY_PRODUCT
# ─────────────────────────────────────────────────────────────────────────────
def action_query_product(entities: dict, user_id: str) -> str:
    # Try item names first, then fall back to customer name as keyword
    item_names = [e["item"] for e in entities.get("items", [])]
    customer_as_keyword = entities.get("customer")

    keywords = item_names if item_names else ([customer_as_keyword] if customer_as_keyword else [])

    if not keywords:
        # Return all items
        items = Item.query.filter_by(user_id=user_id, is_active=True).limit(10).all()
        if not items:
            return "No items found in inventory."
        lines = [f"- {i.name}: Rs.{float(i.price):.0f} (Stock: {i.stock_quantity})" for i in items]
        return "Available items:\n" + "\n".join(lines)

    results = []
    for kw in keywords:
        items = Item.query.filter(
            Item.user_id == user_id,
            Item.name.ilike(f"%{kw}%"),
            Item.is_active == True,
        ).all()
        for item in items:
            results.append(
                f"{item.name}: Rs.{float(item.price):.0f} | Stock: {item.stock_quantity} | Category: {item.category or 'General'}"
            )

    if not results:
        return f"No products found matching '{', '.join(keywords)}'."

    return "Product details:\n" + "\n".join(results)

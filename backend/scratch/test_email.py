import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Change to the backend directory to load .env
os.chdir('e:/RetailStore/backend')
load_dotenv()

def test_send_email():
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = os.getenv('SMTP_EMAIL')
    sender_password = os.getenv('SMTP_PASSWORD')
    recipient_email = "jewellersanitha@gmail.com" # Sending to self for test

    print(f"Attempting to send email from {sender_email}")
    
    if not sender_email or not sender_password:
        print("Error: SMTP_EMAIL or SMTP_PASSWORD not set in .env")
        return

    msg = MIMEMultipart()
    msg['Subject'] = "Retail Pro - Test Email"
    msg['From'] = f"Retail Pro <{sender_email}>"
    msg['To'] = recipient_email
    msg.attach(MIMEText("This is a test email from the Retail Pro system.", 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.set_debuglevel(1) # Show SMTP interaction
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print("Test email sent successfully!")
    except Exception as e:
        print(f"Failed to send test email: {str(e)}")

if __name__ == "__main__":
    test_send_email()

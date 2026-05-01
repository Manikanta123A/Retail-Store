import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def test_smtp():
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = os.getenv('SMTP_EMAIL')
    sender_password = os.getenv('SMTP_PASSWORD')
    
    print(f"Testing SMTP for {sender_email}...")
    
    msg = MIMEMultipart()
    msg['Subject'] = "Retail Pro - SMTP Test"
    msg['From'] = sender_email
    msg['To'] = sender_email # Send to self for testing
    msg.attach(MIMEText("Your retail billing system email automation is now active!", 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print("SUCCESS: SMTP connection and login successful. Test email sent to yourself.")
        return True
    except Exception as e:
        print(f"FAILED: {str(e)}")
        return False

if __name__ == "__main__":
    test_smtp()

import hmac
import hashlib
from routers.webhooks import verify_github_signature

def test_verify_github_signature_empty_secret():
    # If GITHUB_SECRET is empty (dev mode), it should return True by default
    import routers.webhooks as wh
    original = wh.GITHUB_SECRET
    wh.GITHUB_SECRET = ""
    assert verify_github_signature(b"payload", "some-sig") is True
    wh.GITHUB_SECRET = original

def test_verify_github_signature_with_secret():
    import routers.webhooks as wh
    original = wh.GITHUB_SECRET
    wh.GITHUB_SECRET = "supersecret"
    
    payload = b"testpayload"
    expected_hash = hmac.new(b"supersecret", payload, hashlib.sha256).hexdigest()
    sig = f"sha256={expected_hash}"
    
    assert verify_github_signature(payload, sig) is True
    assert verify_github_signature(payload, "invalid-sig") is False
    
    wh.GITHUB_SECRET = original

from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.on('console', lambda msg: print(f'CONSOLE [{msg.type}]: {msg.text}'))
        page.on('pageerror', lambda err: print(f'PAGE ERROR: {err.name} - {err.message}\n{err.stack}'))
        
        print('Navigating...')
        page.goto('http://localhost:8000/', wait_until='networkidle')
        
        print('Page loaded. Checking for auth overlay...')
        overlay_style = page.evaluate('document.getElementById("auth-overlay").style.display')
        print(f'Auth Overlay Display: {overlay_style}')
        
        print('Filling in credentials...')
        page.fill('#auth-email', 'testuser@example.com')
        page.fill('#auth-password', 'password123')
        
        print('Clicking signup...')
        page.click('#btn-signup')
        
        print('Waiting 3 seconds...')
        page.wait_for_timeout(3000)
        
        error_display = page.evaluate('document.getElementById("auth-error").style.display')
        error_text = page.evaluate('document.getElementById("auth-error").textContent')
        print(f'Auth Error Display: {error_display}')
        print(f'Auth Error Text: {error_text}')
        
        overlay_style_after = page.evaluate('document.getElementById("auth-overlay").style.display')
        print(f'Auth Overlay Display After: {overlay_style_after}')
        
        browser.close()

run()

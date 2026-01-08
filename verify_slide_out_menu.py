from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    context = browser.new_context(
        viewport={"width": 375, "height": 667}
    )
    page = context.new_page()
    page.goto("http://localhost:3000")

    # Click the menu button to open the slide-out menu
    menu_button = page.locator('button:has([data-testid="icon-menu"])')
    menu_button.click()

    # Take a screenshot of the open menu
    page.screenshot(path="/home/jules/verification/slide_out_menu_mobile.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

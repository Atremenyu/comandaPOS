from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    context = browser.new_context(
        viewport={"width": 375, "height": 667}
    )
    page = context.new_page()
    page.goto("http://localhost:3000")

    # Take a screenshot of the product catalog
    page.screenshot(path="/home/jules/verification/product_catalog_mobile.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

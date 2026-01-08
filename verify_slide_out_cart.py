
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Set viewport to a mobile size
        await page.set_viewport_size({"width": 375, "height": 667})

        await page.goto("http://localhost:3000")

        # Wait for the app to load
        await page.wait_for_selector("text=Iniciando Sistema...", state="hidden")
        await page.wait_for_selector("text=Todos")

        # Add a couple of items to the cart
        await page.click("text=Hamburguesa Clásica")
        await page.click("text=Papas Fritas XL")

        # Verify the "TU PEDIDO" button is visible
        order_button_selector = "button:has-text('TU PEDIDO')"
        await page.wait_for_selector(order_button_selector)

        # Click the "TU PEDIDO" button
        await page.click(order_button_selector)

        # Wait for the slide-out animation to complete
        await asyncio.sleep(0.5)

        # Verify the cart panel is visible
        await page.wait_for_selector("text=Tu Pedido")
        await page.wait_for_selector("text=2 ITEMS")

        # Take a screenshot
        screenshot_path = "/home/jules/verification/slide_out_cart_mobile.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

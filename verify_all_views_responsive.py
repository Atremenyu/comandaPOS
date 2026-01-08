
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Set viewport to a mobile size
        await page.set_viewport_size({"width": 375, "height": 667})

        await page.goto("http://localhost:3000")

        # --- 1. POS View (already verified, but good to double-check) ---
        await page.wait_for_selector("text=Iniciando Sistema...", state="hidden")
        await page.wait_for_selector("text=Todos")
        await page.screenshot(path="/home/jules/verification/responsive_pos_view.png")
        print("Screenshot saved for POS View")

        # Open the slide-out menu
        menu_button_selector = "button[aria-label='Open menu']"
        await page.click(menu_button_selector)
        await asyncio.sleep(0.5)

        slide_out_menu_selector = "div:has(> div > h2:has-text('Menu'))"

        # --- 2. Dispatch View ---
        await page.locator(slide_out_menu_selector).locator("button:has-text('Cocina')").click()
        await page.wait_for_selector("text=Sin Órdenes Pendientes")
        # Add an order to see the actual view
        await page.click(menu_button_selector)
        await asyncio.sleep(0.5)
        await page.locator(slide_out_menu_selector).locator("button:has-text('Venta')").click()
        await page.click("text=Hamburguesa Clásica")
        await page.click("button:has-text('TU PEDIDO')")
        await page.click("button:has-text('COBRAR')")
        await page.click("button:has-text('FINALIZAR COBRO')")
        await page.wait_for_selector("text=EN PREPARACIÓN")
        await page.screenshot(path="/home/jules/verification/responsive_dispatch_view.png")
        print("Screenshot saved for Dispatch View")

        # --- 3. History View ---
        await page.click(menu_button_selector)
        await asyncio.sleep(0.5)
        await page.locator(slide_out_menu_selector).locator("button:has-text('Historial')").click()
        await page.wait_for_selector("text=Registro de Movimientos")
        await page.screenshot(path="/home/jules/verification/responsive_history_view.png")
        print("Screenshot saved for History View")

        # --- 4. Product Management View ---
        await page.click(menu_button_selector)
        await asyncio.sleep(0.5)
        await page.locator(slide_out_menu_selector).locator("button:has-text('Config')").click()
        await page.wait_for_selector("text=Menú de Ventas")
        await page.screenshot(path="/home/jules/verification/responsive_product_management_view.png")
        print("Screenshot saved for Product Management View")

        # Test categories tab
        await page.click("text=Categorías")
        await page.wait_for_selector('[placeholder="Nueva categoría..."]')
        await page.screenshot(path="/home/jules/verification/responsive_categories_view.png")
        print("Screenshot saved for Categories View")

        # Test general tab
        await page.click("text=General")
        await page.wait_for_selector("text=Ajustes del Negocio")
        await page.screenshot(path="/home/jules/verification/responsive_general_settings_view.png")
        print("Screenshot saved for General Settings View")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

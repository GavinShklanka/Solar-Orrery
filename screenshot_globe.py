import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\gshk0\.gemini\antigravity\brain\c0577762-e111-4ecc-8cdf-3bd99f253176"

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--enable-webgl', '--use-gl=swiftshader', '--enable-gpu-rasterization']
    )
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    console_lines = []
    page.on("console", lambda msg: console_lines.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: console_lines.append(f"[PAGE_ERROR] {err}"))

    print("Navigating...")
    page.goto("http://localhost:5174", timeout=60000)
    
    print("Waiting 25 seconds...")
    page.wait_for_timeout(25000)

    page.screenshot(path=f"{output_dir}\\globe_swiftshader.png")
    print("Screenshot saved.")

    print("\n--- CONSOLE ---")
    for line in console_lines:
        print(line)
    print("--- END ---")

    browser.close()

from pathlib import Path
from playwright.sync_api import sync_playwright


def main() -> None:
    output = Path('/private/tmp/outr-browser-smoke.png')
    command_output = Path('/private/tmp/outr-command-center.png')
    light_output = Path('/private/tmp/outr-command-light.png')
    preview_output = Path('/private/tmp/outr-live-preview.png')
    map_output = Path('/private/tmp/outr-lead-map.png')
    mobile_output = Path('/private/tmp/outr-mobile-command.png')
    loading_output = Path('/private/tmp/outr-loading-screen.png')
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:5173", wait_until="domcontentloaded")
        page.locator(".boot-screen").wait_for()
        page.screenshot(path=str(loading_output))
        page.get_by_role("heading", name="Good evening, Piyush.").wait_for()
        page.locator(".boot-screen").wait_for(state="detached")
        assert page.locator(".metric-card").count() == 4
        source_runtime = page.get_by_text("OutreachOS source bridge", exact=True)
        source_runtime.wait_for()
        page.locator(".source-runtime-status strong").get_by_text("leads", exact=False).wait_for()
        page.screenshot(path=str(light_output), full_page=True)
        page.get_by_role("button", name="Live preview").click()
        page.get_by_role("dialog", name="Live workspace preview").wait_for()
        page.get_by_role("heading", name="Signal room").wait_for()
        page.wait_for_timeout(450)
        page.screenshot(path=str(preview_output))
        page.get_by_role("button", name="Close live preview").click()
        page.get_by_role("button", name="Switch to dark mode").click()
        assert page.locator("html[data-theme='dark']").count() == 1
        page.screenshot(path=str(command_output), full_page=True)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.get_by_role("button", name="Scroll back to top").wait_for()
        page.get_by_role("button", name="Scroll back to top").click()
        page.wait_for_timeout(900)
        assert page.evaluate("window.scrollY") < 10

        page.get_by_role("button", name="Leads", exact=True).click()
        page.get_by_role("heading", name="Lead explorer").wait_for()
        page.locator(".map-canvas").wait_for()
        page.wait_for_timeout(750)
        page.screenshot(path=str(map_output), full_page=True)
        page.get_by_role("button", name="List view").click()
        page.get_by_label("Search leads").fill("North")
        page.get_by_role("cell", name="Northstar Labs").first.click()
        page.get_by_role("complementary", name="Lead details").wait_for()
        page.get_by_role("button", name="Close lead details").click()

        page.get_by_role("button", name="Agent pool", exact=True).click()
        page.get_by_role("heading", name="Agent pool").wait_for()
        agent_cards = page.locator(".agent-card").count()
        assert agent_cards >= 6

        page.get_by_role("button", name="Inbox").click()
        page.get_by_role("heading", name="Unified inbox").wait_for()
        page.get_by_role("button", name="Review & send").click()
        page.locator(".toast").wait_for()

        page.screenshot(path=str(output), full_page=True)

        mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        mobile.goto("http://127.0.0.1:5173", wait_until="domcontentloaded")
        mobile.locator(".boot-screen").wait_for(state="detached")
        mobile.get_by_role("heading", name="Good evening, Piyush.").wait_for()
        mobile.screenshot(path=str(mobile_output), full_page=True)
        mobile.close()

        reduced = browser.new_page(viewport={"width": 1024, "height": 768})
        reduced.emulate_media(reduced_motion="reduce")
        reduced.goto("http://127.0.0.1:5173", wait_until="domcontentloaded")
        reduced.locator(".boot-screen").wait_for(state="detached")
        assert reduced.locator(".view-stage").evaluate("element => getComputedStyle(element).animationName") == "none"
        reduced.close()
        print({
            "title": page.title(),
            "final_heading": page.locator("h1").inner_text(),
            "agent_cards": agent_cards,
            "page_errors": errors,
            "screenshot": str(output),
            "command_screenshot": str(command_output),
            "light_screenshot": str(light_output),
            "preview_screenshot": str(preview_output),
            "map_screenshot": str(map_output),
            "mobile_screenshot": str(mobile_output),
            "loading_screenshot": str(loading_output),
        })
        browser.close()


if __name__ == "__main__":
    main()

from playwright.sync_api import sync_playwright
import sys

def test_navigation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=" * 60)
        print("测试导航条功能")
        print("=" * 60)

        # 1. 导航到页面
        print("\n1. 访问 overview.html 页面...")
        page.goto('http://localhost:60080/overview.html')
        page.wait_for_load_state('networkidle')
        print("   ✅ 页面加载完成")

        # 2. 查找导航条元素
        print("\n2. 查找导航条元素...")
        menu_button = page.locator('#menu-button')
        header_title = page.locator('#HeaderTitle')
        edit_button = page.locator('#editButton')

        print(f"   - 菜单按钮: {'✅ 存在' if menu_button.count() > 0 else '❌ 不存在'}")
        print(f"   - 标题: {'✅ 存在' if header_title.count() > 0 else '❌ 不存在'}")
        print(f"   - 编辑按钮: {'✅ 存在' if edit_button.count() > 0 else '❌ 不存在'}")

        if header_title.count() > 0:
            title_text = header_title.text_content()
            print(f"   - 标题内容: {title_text}")

        # 3. 测试菜单按钮点击
        print("\n3. 测试菜单按钮点击...")
        try:
            menu_button.click()
            page.wait_for_timeout(500)
            print("   ✅ 菜单按钮可点击")

            # 4. 检查菜单是否展开
            print("\n4. 检查菜单状态...")
            # 可能会有导航菜单出现，让我们检查一下
            nav_menu = page.locator('.nav-menu, .menu, nav, #nav')
            if nav_menu.count() > 0:
                print(f"   ✅ 找到导航菜单")
                nav_items = page.locator('a, button, .nav-item, .menu-item')
                print(f"   - 菜单项数量: {nav_items.count()}")
            else:
                print("   ⚠️ 未找到明显的导航菜单")

        except Exception as e:
            print(f"   ❌ 菜单按钮点击失败: {e}")

        # 5. 测试编辑按钮
        print("\n5. 测试编辑按钮...")
        try:
            edit_button.click()
            page.wait_for_timeout(300)
            button_text = edit_button.text_content()
            print(f"   ✅ 编辑按钮可点击，当前状态: {button_text}")
        except Exception as e:
            print(f"   ❌ 编辑按钮点击失败: {e}")

        # 6. 截图保存
        print("\n6. 保存页面截图...")
        page.screenshot(path='D:/temp/navigation_test.png', full_page=True)
        print("   ✅ 截图已保存到 D:/temp/navigation_test.png")

        # 7. 获取页面控制台日志
        print("\n7. 检查控制台日志...")
        page.on('console', lambda msg: print(f"   [Console] {msg.type}: {msg.text}"))

        print("\n" + "=" * 60)
        print("测试完成！")
        print("=" * 60)

        browser.close()

if __name__ == "__main__":
    try:
        test_navigation()
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        sys.exit(1)

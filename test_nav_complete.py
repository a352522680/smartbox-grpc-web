from playwright.sync_api import sync_playwright
import sys
import time

def test_navigation():
    with sync_playwright() as p:
        try:
            # 尝试使用系统Chrome
            browser = p.chromium.launch(channel="chrome", headless=False)
        except Exception as e1:
            print(f"尝试使用系统Chrome失败: {e1}")
            try:
                # 尝试使用Chromium
                browser = p.chromium.launch(channel="chromium", headless=False)
            except Exception as e2:
                print(f"尝试使用Chromium失败: {e2}")
                print("无法找到可用的浏览器")
                sys.exit(1)
        
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"[{msg.type.upper()}] {msg.text}"))

        print("=" * 70)
        print("🧪 导航条完整功能测试")
        print("=" * 70)

        # 1. 测试概览页面
        print("\n📍 测试1: 访问 overview.html 页面")
        print("-" * 70)
        page.goto('http://localhost:60080/overview.html')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        # 截图初始状态
        page.screenshot(path='D:/temp/01_initial_page.png', full_page=True)
        print("   ✅ 页面加载完成")
        print("   📸 截图已保存: 01_initial_page.png")

        # 2. 检查核心导航元素
        print("\n📍 测试2: 检查核心导航元素")
        print("-" * 70)
        
        elements = {
            '#menu-button': '菜单按钮',
            '#nav-overlay': '导航遮罩层',
            '#nav-close-button': '关闭菜单按钮',
            '.nav-group-title': '导航组标题',
            '.nav-page-button': '导航页面按钮',
            '#nav-logout-button': '退出登录按钮'
        }
        
        for selector, name in elements.items():
            count = page.locator(selector).count()
            status = '✅ 存在' if count > 0 else '❌ 不存在'
            print(f"   {status} {name} ({selector})")
            if count > 0:
                print(f"         数量: {count}")

        # 3. 测试打开导航菜单
        print("\n📍 测试3: 测试打开导航菜单")
        print("-" * 70)
        
        menu_button = page.locator('#menu-button')
        if menu_button.count() > 0:
            print("   点击菜单按钮...")
            menu_button.click()
            page.wait_for_timeout(500)
            
            # 检查菜单是否可见
            nav_overlay = page.locator('#nav-overlay')
            is_hidden = nav_overlay.get_attribute('class')
            print(f"   菜单状态: {'已打开' if 'hidden' not in is_hidden else '已关闭'}")
            
            # 截图打开的菜单
            page.screenshot(path='D:/temp/02_menu_opened.png', full_page=True)
            print("   📸 截图已保存: 02_menu_opened.png")
        else:
            print("   ❌ 菜单按钮不存在")

        # 4. 测试导航组展开/折叠
        print("\n📍 测试4: 测试导航组展开/折叠")
        print("-" * 70)
        
        nav_groups = page.locator('.nav-group-title')
        group_count = nav_groups.count()
        print(f"   找到 {group_count} 个导航组")
        
        for i in range(group_count):
            group = nav_groups.nth(i)
            group_text = group.locator('span').first.text_content()
            print(f"\n   测试导航组 {i+1}: {group_text.strip()}")
            
            # 点击展开/折叠
            group.click()
            page.wait_for_timeout(300)
            
            # 检查是否展开
            parent = group.locator('..')
            is_open = 'is-open' in parent.get_attribute('class')
            print(f"      状态: {'展开' if is_open else '折叠'}")
            
            # 获取子菜单项
            items = page.locator('.nav-group-items').nth(i).locator('.nav-page-button')
            print(f"      子菜单项数量: {items.count()}")
            
            for j in range(items.count()):
                item = items.nth(j)
                href = item.get_attribute('href')
                text = item.text_content()
                print(f"         - {text.strip()} → {href}")

        # 5. 测试导航到各页面
        print("\n📍 测试5: 测试导航到各页面")
        print("-" * 70)
        
        test_pages = [
            ('index.html', '机床采集看板'),
            ('Energy.html', '能耗看板'),
            ('water_yearly_shift_report.html', '水能源年度推移表'),
            ('KPI.html', '年度KPI设置')
        ]
        
        for href, page_name in test_pages:
            print(f"\n   导航到: {page_name} ({href})")
            try:
                page.goto(f'http://localhost:60080/{href}')
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                
                # 检查页面标题
                title = page.title()
                print(f"      ✅ 页面加载成功，标题: {title}")
                
                # 检查当前页面链接是否有 active 状态
                active_links = page.locator('.nav-page-button.is-active')
                if active_links.count() > 0:
                    active_text = active_links.first.text_content()
                    print(f"      ✅ 当前活动页面: {active_text.strip()}")
                else:
                    print(f"      ⚠️ 未找到活动页面标记")
                    
            except Exception as e:
                print(f"      ❌ 页面加载失败: {e}")

        # 6. 测试关闭菜单（通过关闭按钮）
        print("\n📍 测试6: 测试关闭菜单")
        print("-" * 70)
        
        # 先打开菜单
        menu_button = page.locator('#menu-button')
        if menu_button.count() > 0:
            menu_button.click()
            page.wait_for_timeout(500)
            print("   菜单已打开")
            
            # 点击关闭按钮
            close_button = page.locator('#nav-close-button')
            if close_button.count() > 0:
                close_button.click()
                page.wait_for_timeout(500)
                
                nav_overlay = page.locator('#nav-overlay')
                is_hidden = 'hidden' in nav_overlay.get_attribute('class')
                print(f"   点击关闭按钮: {'✅ 菜单已关闭' if is_hidden else '❌ 菜单仍然打开'}")
                page.screenshot(path='D:/temp/03_menu_closed.png', full_page=True)
                print("   📸 截图已保存: 03_menu_closed.png")

        # 7. 测试 ESC 键关闭菜单
        print("\n📍 测试7: 测试 ESC 键关闭菜单")
        print("-" * 70)
        
        # 打开菜单
        menu_button = page.locator('#menu-button')
        if menu_button.count() > 0:
            menu_button.click()
            page.wait_for_timeout(500)
            print("   菜单已打开")
            
            # 按 ESC 键
            page.keyboard.press('Escape')
            page.wait_for_timeout(500)
            
            nav_overlay = page.locator('#nav-overlay')
            is_hidden = 'hidden' in nav_overlay.get_attribute('class')
            print(f"   按下 ESC 键: {'✅ 菜单已关闭' if is_hidden else '❌ 菜单仍然打开'}")

        # 8. 测试点击遮罩层关闭菜单
        print("\n📍 测试8: 测试点击遮罩层关闭菜单")
        print("-" * 70)
        
        # 打开菜单
        menu_button = page.locator('#menu-button')
        if menu_button.count() > 0:
            menu_button.click()
            page.wait_for_timeout(500)
            print("   菜单已打开")
            
            # 点击遮罩层
            overlay = page.locator('#nav-overlay')
            overlay.click(position={'x': 10, 'y': 10})
            page.wait_for_timeout(500)
            
            is_hidden = 'hidden' in overlay.get_attribute('class')
            print(f"   点击遮罩层: {'✅ 菜单已关闭' if is_hidden else '❌ 菜单仍然打开'}")

        # 9. 测试退出登录按钮
        print("\n📍 测试9: 测试退出登录按钮")
        print("-" * 70)
        
        menu_button = page.locator('#menu-button')
        if menu_button.count() > 0:
            menu_button.click()
            page.wait_for_timeout(500)
            
            logout_button = page.locator('#nav-logout-button')
            if logout_button.count() > 0:
                logout_button_text = logout_button.text_content()
                print(f"   退出按钮文本: {logout_button_text}")
                print(f"   ✅ 退出登录按钮存在")
            else:
                print(f"   ❌ 退出登录按钮不存在")

        # 10. 打印控制台日志
        print("\n📍 测试10: 检查控制台日志")
        print("-" * 70)
        
        errors = [msg for msg in console_messages if '[error]' in msg.lower()]
        if errors:
            print(f"   ⚠️ 发现 {len(errors)} 个控制台错误:")
            for error in errors:
                print(f"      {error}")
        else:
            print("   ✅ 没有控制台错误")

        # 最终截图
        page.screenshot(path='D:/temp/04_final_state.png', full_page=True)
        print("\n📸 最终截图已保存: 04_final_state.png")

        print("\n" + "=" * 70)
        print("✅ 所有导航测试完成！")
        print("=" * 70)

        browser.close()

if __name__ == "__main__":
    try:
        test_navigation()
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

$(function() {
    $("body").append(`
        <div class="nav-overlay hidden" id="nav-overlay" aria-hidden="true">
            <aside class="nav-drawer" aria-label="Navigation menu">
                <div class="nav-drawer-header">
                    <button class="nav-drawer-menu-button" id="nav-close-button" type="button" aria-label="Close menu">
                        <img class="icon-image icon-image-menu" src="./img/menu.svg" alt="" />
                    </button>
                    <p class="nav-drawer-title">MENU</p>
                </div>
                <div class="nav-drawer-pages" id="nav-drawer-pages">
                    <div class="nav-group">
                        <button class="nav-group-title" data-nav-group="overview">
                            <span>概览与看板</span>
                            <span class="nav-group-arrow">▼</span>
                        </button>
                        <div class="nav-group-items" data-nav-group="overview">
                            <a class="nav-page-button" href="./overview.html">总览</a>
                            <a class="nav-page-button" href="./index.html">机床采集看板</a>
                            <a class="nav-page-button" href="./Energy.html">能耗看板</a>
                        </div>
                    </div>
                    <div class="nav-group">
                        <button class="nav-group-title" data-nav-group="energy">
                            <span>能源报表</span>
                            <span class="nav-group-arrow">▼</span>
                        </button>
                        <div class="nav-group-items" data-nav-group="energy">
                            <a class="nav-page-button" href="./water_yearly_shift_report.html">水能源年度推移表</a>
                            <a class="nav-page-button" href="./water_monthly_shift_report.html">水能源月度推移表</a>
                        </div>
                    </div>
                    <div class="nav-group">
                        <button class="nav-group-title" data-nav-group="settings">
                            <span>设置与KPI</span>
                            <span class="nav-group-arrow">▼</span>
                        </button>
                        <div class="nav-group-items" data-nav-group="settings">
                            <a class="nav-page-button" href="./KPI.html">年度KPI设置</a>
                        </div>
                    </div>
                </div>
                <div class="nav-drawer-footer">
                    <div class="nav-user-row">
                        
                        
                    </div>
                    <button class="nav-logout-button" id="nav-logout-button" type="button">LOGOUT</button>
                </div>
            </aside>
        </div>
    `);

    const currentPage = window.location.pathname.split("/").pop();
    
    $(".nav-page-button").each(function() {
        const href = $(this).attr("href");
        const pageName = href.replace('./', '');
        
        if (pageName === currentPage || (currentPage === "" && pageName === "index.html")) {
            $(this).addClass("is-active");
            $(this).attr("aria-current", "page");
            
            const parentGroup = $(this).closest('.nav-group');
            parentGroup.addClass('is-open');
        } else {
            $(this).removeClass("is-active");
            $(this).removeAttr("aria-current");
        }
    });

    const menuButton = document.querySelector("#menu-button");
    const navOverlay = document.querySelector("#nav-overlay");
    const navCloseButton = document.querySelector("#nav-close-button");
    const navLogoutButton = document.querySelector("#nav-logout-button");

    function setNavOverlay(open) {
        if (!navOverlay) return;
        if (open) {
            navOverlay.classList.remove("hidden");
            navOverlay.setAttribute("aria-hidden", "false");
            
            const currentPage = window.location.pathname.split("/").pop();
            $(".nav-page-button").each(function() {
                const href = $(this).attr("href");
                const pageName = href.replace('./', '');
                if (pageName === currentPage || (currentPage === "" && pageName === "index.html")) {
                    const parentGroup = $(this).closest('.nav-group');
                    $('.nav-group').removeClass('is-open');
                    parentGroup.addClass('is-open');
                    return false;
                }
            });
        } else {
            navOverlay.classList.add("hidden");
            navOverlay.setAttribute("aria-hidden", "true");
        }
    }

    if (menuButton) {
        menuButton.addEventListener("click", (e) => {
            e.stopPropagation();
            setNavOverlay(true);
        });
    }

    if (navCloseButton) {
        navCloseButton.addEventListener("click", (e) => {
            e.stopPropagation();
            setNavOverlay(false);
        });
    }

    if (navLogoutButton) {
        navLogoutButton.addEventListener("click", () => {
            window.location.href = "./Login.html";
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener("click", (e) => {
            if (e.target === navOverlay) {
                setNavOverlay(false);
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            setNavOverlay(false);
        }
    });

    $('.nav-group-title').on('click', function() {
        const $group = $(this).closest('.nav-group');
        $group.toggleClass('is-open');
    });
});
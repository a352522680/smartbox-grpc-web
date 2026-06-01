const loginForm = document.querySelector("#login-form");
const passwordInput = document.querySelector("#password-input");
const passwordToggle = document.querySelector("#password-toggle");
const passwordIconShow = document.querySelector(".password-icon-show");
const passwordIconHide = document.querySelector(".password-icon-hide");

if (passwordToggle && passwordInput && passwordIconShow && passwordIconHide) {
  passwordToggle.addEventListener("click", () => {
    const shouldShowPassword = passwordInput.type === "password";
    passwordInput.type = shouldShowPassword ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
    passwordToggle.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
    passwordIconShow.classList.toggle("hidden", shouldShowPassword);
    passwordIconHide.classList.toggle("hidden", !shouldShowPassword);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    
    // 获取用户名和密码
    var username = $("#Username").val();
    var password = $("#password-input").val();
    
    // 验证输入
    if (!username || !password) {
        alert("请输入用户名和密码");
        return;
    }
    
    // 发送 AJAX 请求
    $.ajax({
        url: '/api/checkUser',  // ✅ 修改这里：使用正确的路由地址
        type: 'GET',
        contentType: 'application/json',
        data: {                 // 使用 data 参数，不是 body
            UserID: username,
            PassWord: password
        },
        success: function(response) {
            console.log("登录成功:", response);
            if (response.success) {
                // 登录成功，跳转到首页
                window.location.href = "./Energy.html";
                // 保存用户信息
                localStorage.setItem('userInfo', JSON.stringify(response.data));
            } else {
                alert(response.message || "登录失败");
            }
        },
        error: function(xhr, status, error) {
            console.error("请求失败:", error);
            if (xhr.status === 401) {
                alert("用户名或密码错误");
            } else if (xhr.status === 400) {
                alert("请填写完整的用户名和密码");
            } else {
                alert("网络错误，请稍后重试");
            }
        }
    });
  });
}
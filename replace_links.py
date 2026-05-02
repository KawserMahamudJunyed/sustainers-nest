import os

old_str = '<a href="/signin" class="auth-login-link">Sign In</a><a href="/admin" class="auth-admin-link nav-cta" style="display:none">Admin</a><a href="#" class="auth-logout-btn" style="display:none" onclick="handleLogout(event)">Logout</a><a href="/get-involved" class="nav-cta">Join Now</a>'
new_str = '<a href="/signin" class="auth-login-link nav-cta">Sign In / Join</a><a href="/admin" class="auth-admin-link nav-cta" style="display:none">Admin</a><a href="#" class="auth-logout-btn nav-cta" style="display:none" onclick="handleLogout(event)">Logout</a>'

for f in os.listdir('.'):
    if f.endswith('.html'):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if old_str in content:
            content = content.replace(old_str, new_str)
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Updated {f}")

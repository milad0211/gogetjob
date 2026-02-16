# راهنمای تنظیم ngrok برای OAuth

## مشکل فعلی
زمانی که از ngrok استفاده می‌کنید، لاگین با Google کار نمی‌کند.

## علت مشکل
Supabase باید دقیقاً بداند کدام URL‌ها مجاز به دریافت کد احراز هویت هستند.

## راه حل (مرحله به مرحله)

### 1. تنظیمات Supabase
به داشبورد Supabase بروید:
`https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration`

در بخش **Redirect URLs**، این دو آدرس را اضافه کنید:
```
http://localhost:3000/auth/callback
https://uninitiative-isopolitical-alia.ngrok-free.dev/auth/callback
```

### 2. تنظیمات Google Cloud Console
به Google Cloud Console بروید:
`https://console.cloud.google.com/apis/credentials`

در بخش **Authorized redirect URIs**، این آدرس را اضافه کنید:
```
https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
```

**نکته مهم:** آدرس redirect در Google باید به Supabase باشد، نه به ngrok!

### 3. تست کردن
1. مرورگر را باز کنید و به آدرس ngrok بروید
2. F12 را بزنید و Console را باز کنید
3. روی دکمه "Continue with Google" کلیک کنید
4. لاگ‌ها را بررسی کنید:
   - اگر پیام "OAuth initiated successfully" را دیدید، تنظیمات درست است
   - اگر خطایی دیدید، متن خطا را کپی کنید

### 4. عیب‌یابی
اگر همچنان کار نمی‌کند:

**بررسی 1:** آیا در Console خطایی مشاهده می‌کنید؟
**بررسی 2:** آیا صفحه Google Login باز می‌شود؟
**بررسی 3:** آیا بعد از لاگین به صفحه خطا می‌رود؟

## یادداشت‌های فنی

### چرا trigger کار نمی‌کند؟
Trigger فقط زمانی اجرا می‌شود که یک کاربر **جدید** در `auth.users` ایجاد شود.
اگر کاربری را از `profiles` حذف کنید ولی در `auth.users` باقی بماند، trigger دیگر اجرا نمی‌شود.

### راه حل
از `ON CONFLICT DO UPDATE` استفاده کنید تا profile همیشه به‌روز شود.

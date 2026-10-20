<div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
  <h2>🍹 Nightzone - Test Pay 5 UIDs</h2>
  <p>Nhấn nút bên dưới để kích hoạt thanh toán hàng loạt qua Backend API.</p>
  
  <button id="payBtn" onclick="triggerPay5Uid()" style="padding: 15px 30px; font-size: 16px; font-weight: bold; background-color: #7b2cbf; color: white; border: none; border-radius: 8px; cursor: pointer;">
    🚀 Chạy Pay 5 UIDs ngay
  </button>

  <pre id="resultLog" style="margin-top: 20px; text-align: left; background: #1e1e1e; color: #00ffcc; padding: 15px; border-radius: 6px; max-width: 600px; margin-left: auto; margin-right: auto; overflow-x: auto; display: none;"></pre>
</div>

<script>
  async function triggerPay5Uid() {
    const btn = document.getElementById('payBtn');
    const logBox = document.getElementById('resultLog');
    
    btn.innerText = "Đang xử lý giao dịch...";
    btn.disabled = true;
    logBox.style.display = "block";
    logBox.innerText = "Đang gửi yêu cầu tới server API...";

    try {
      const response = await fetch('/api/pay5uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      logBox.innerText = JSON.stringify(data, null, 2);
    } catch (error) {
      logBox.innerText = "Lỗi kết nối: " + error.message;
    } finally {
      btn.innerText = "🚀 Chạy Pay 5 UIDs ngay";
      btn.disabled = false;
    }
  }
</script>

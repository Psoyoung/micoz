"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// 실제 환경에서는 SMTP 설정이나 SendGrid, SES 등을 사용해야 합니다
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = (template) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const info = yield transporter.sendMail(Object.assign({ from: `"MICOZ" <${process.env.SMTP_FROM || 'noreply@micoz.com'}>` }, template));
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
});
exports.sendEmail = sendEmail;
const sendVerificationEmail = (email, token, firstName) => __awaiter(void 0, void 0, void 0, function* () {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>이메일 인증 - MICOZ</title>
      <style>
        body { font-family: 'Pretendard', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8FBC8F, #F5F5DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .button { display: inline-block; background: #8FBC8F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #2F4F2F; margin: 0;">MICOZ</h1>
          <p style="color: #2F4F2F; margin: 10px 0 0 0;">자연에서 찾은 아름다움의 비밀</p>
        </div>
        <div class="content">
          <h2>안녕하세요 ${firstName}님!</h2>
          <p>MICOZ에 가입해 주셔서 감사합니다. 계정을 활성화하기 위해 이메일 인증을 완료해 주세요.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button">이메일 인증하기</a>
          </div>
          
          <p>버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣어 주세요:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
          </p>
          
          <p><strong>이 링크는 24시간 후에 만료됩니다.</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #666;">
            본 이메일은 자동으로 발송된 메일입니다. 문의사항이 있으시면 
            <a href="mailto:hello@micoz.com">hello@micoz.com</a>으로 연락해 주세요.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2024 MICOZ. All rights reserved.</p>
          <p>서울특별시 강남구 테헤란로 123, MICOZ 본사</p>
        </div>
      </div>
    </body>
    </html>
  `;
    const text = `
    안녕하세요 ${firstName}님!
    
    MICOZ에 가입해 주셔서 감사합니다. 
    계정을 활성화하기 위해 아래 링크를 클릭하여 이메일 인증을 완료해 주세요:
    
    ${verificationUrl}
    
    이 링크는 24시간 후에 만료됩니다.
    
    MICOZ 팀 드림
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: '[MICOZ] 이메일 인증을 완료해 주세요',
        html,
        text,
    });
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = (email, token, firstName) => __awaiter(void 0, void 0, void 0, function* () {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>비밀번호 재설정 - MICOZ</title>
      <style>
        body { font-family: 'Pretendard', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8FBC8F, #F5F5DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .button { display: inline-block; background: #8FBC8F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #2F4F2F; margin: 0;">MICOZ</h1>
          <p style="color: #2F4F2F; margin: 10px 0 0 0;">자연에서 찾은 아름다움의 비밀</p>
        </div>
        <div class="content">
          <h2>안녕하세요 ${firstName}님!</h2>
          <p>비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해 주세요.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
          </div>
          
          <p>버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣어 주세요:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          
          <div class="warning">
            <p><strong>⚠️ 보안 알림</strong></p>
            <p>• 이 링크는 1시간 후에 만료됩니다</p>
            <p>• 비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시해 주세요</p>
            <p>• 의심스러운 활동이 발견되면 즉시 고객센터로 연락해 주세요</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #666;">
            본 이메일은 자동으로 발송된 메일입니다. 문의사항이 있으시면 
            <a href="mailto:hello@micoz.com">hello@micoz.com</a>으로 연락해 주세요.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2024 MICOZ. All rights reserved.</p>
          <p>서울특별시 강남구 테헤란로 123, MICOZ 본사</p>
        </div>
      </div>
    </body>
    </html>
  `;
    const text = `
    안녕하세요 ${firstName}님!
    
    비밀번호 재설정 요청을 받았습니다.
    아래 링크를 클릭하여 새로운 비밀번호를 설정해 주세요:
    
    ${resetUrl}
    
    이 링크는 1시간 후에 만료됩니다.
    비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시해 주세요.
    
    MICOZ 팀 드림
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: '[MICOZ] 비밀번호 재설정 요청',
        html,
        text,
    });
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendWelcomeEmail = (email, firstName) => __awaiter(void 0, void 0, void 0, function* () {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>환영합니다! - MICOZ</title>
      <style>
        body { font-family: 'Pretendard', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8FBC8F, #F5F5DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .button { display: inline-block; background: #8FBC8F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 10px 10px; }
        .benefits { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #2F4F2F; margin: 0;">MICOZ</h1>
          <p style="color: #2F4F2F; margin: 10px 0 0 0;">자연에서 찾은 아름다움의 비밀</p>
        </div>
        <div class="content">
          <h2>환영합니다, ${firstName}님! 🌿</h2>
          <p>MICOZ 가족이 되어주셔서 진심으로 감사합니다. 자연의 순수함과 현대 과학의 만남으로 만들어진 특별한 뷰티 여정을 함께 시작해요!</p>
          
          <div class="benefits">
            <h3>회원 혜택을 확인해보세요</h3>
            <ul>
              <li>🎁 신규 회원 10% 할인 쿠폰</li>
              <li>💝 생일 기념 특별 선물</li>
              <li>⭐ 구매 금액별 등급 혜택</li>
              <li>📱 신제품 및 세일 정보 우선 알림</li>
              <li>🔬 무료 피부 진단 및 맞춤 제품 추천</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" class="button">제품 둘러보기</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" class="button">프로필 설정</a>
          </div>
          
          <p>궁금한 점이 있으시면 언제든지 <a href="mailto:hello@micoz.com">hello@micoz.com</a>으로 연락주세요. 친절하게 도와드리겠습니다.</p>
          
          <p>다시 한 번 MICOZ에 오신 것을 환영하며, 건강하고 아름다운 라이프스타일을 함께 만들어가요! ✨</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 MICOZ. All rights reserved.</p>
          <p>서울특별시 강남구 테헤란로 123, MICOZ 본사</p>
        </div>
      </div>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)({
        to: email,
        subject: '[MICOZ] 환영합니다! 특별한 뷰티 여정을 시작하세요 🌿',
        html,
    });
});
exports.sendWelcomeEmail = sendWelcomeEmail;

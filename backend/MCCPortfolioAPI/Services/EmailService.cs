using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace MCCPortfolioAPI.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            // Log to local file as backup
            try
            {
                var logPath = Path.Combine(Directory.GetCurrentDirectory(), "sent-emails.txt");
                var emailContent = $"\n========================================\n" +
                                   $"DATE: {DateTime.UtcNow}\n" +
                                   $"TO: {toEmail}\n" +
                                   $"SUBJECT: {subject}\n" +
                                   $"BODY:\n{body}\n" +
                                   $"========================================\n";
                
                await File.AppendAllTextAsync(logPath, emailContent);
                System.Console.WriteLine($"[EMAIL LOGGED] To: {toEmail}");
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[EMAIL FILE LOG ERROR] Failed to log email: {ex.Message}");
            }

            // Send actual email via Google SMTP
            try
            {
                var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
                var portStr = _configuration["EmailSettings:Port"] ?? "587";
                var port = int.Parse(portStr);
                var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "alwinrosh@gmail.com";
                var senderName = _configuration["EmailSettings:SenderName"] ?? "MCC Placement Cell";
                var username = _configuration["EmailSettings:Username"] ?? "alwinrosh@gmail.com";
                var password = _configuration["EmailSettings:Password"] ?? "pwimgfufetjtgfob";

                using (var client = new SmtpClient(smtpServer, port))
                {
                    client.Credentials = new NetworkCredential(username, password);
                    client.EnableSsl = true;

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(senderEmail, senderName),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = false
                    };

                    mailMessage.To.Add(toEmail);

                    await client.SendMailAsync(mailMessage);
                    System.Console.WriteLine($"[EMAIL SENT SUCCESSFULLY] To: {toEmail}");
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[EMAIL SMTP ERROR] Failed to send email via SMTP to {toEmail}: {ex.Message}");
            }
        }
    }
}

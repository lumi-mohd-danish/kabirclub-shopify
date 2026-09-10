'use client';

const Contact = () => {
  return (
    <section className="section">
      <div className="container-page flex flex-col gap-10 md:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-ink-muted">Contact</p>
          <h2 className="font-display text-h1 text-ink">Connect With Us</h2>
          <div className="rule-zari mt-1 w-16" aria-hidden="true" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          {/* Contact Information */}
          <div className="flex flex-col gap-6 border border-line bg-paper-raised p-6 md:p-8">
            <h3 className="text-h3 text-ink">Get in Touch</h3>

            {/* Social Links */}
            <div className="flex flex-col gap-4">
              {/* WhatsApp */}
              <a
                href="https://wa.me/917991812899"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-line p-4 transition-colors duration-fast ease-cloth hover:border-line-strong hover:bg-paper-sunk"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-paper-sunk text-zari-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
                  </svg>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-body font-medium text-ink">WhatsApp</span>
                  <span className="text-body-sm text-ink-muted">Chat with us instantly</span>
                </span>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/kabirclub50"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-line p-4 transition-colors duration-fast ease-cloth hover:border-line-strong hover:bg-paper-sunk"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-paper-sunk text-zari-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-body font-medium text-ink">Instagram</span>
                  <span className="text-body-sm text-ink-muted">Follow us @kabirclub50</span>
                </span>
              </a>

              {/* Email */}
              <a
                href="mailto:kabirclub50@gmail.com"
                className="flex items-center gap-4 border border-line p-4 transition-colors duration-fast ease-cloth hover:border-line-strong hover:bg-paper-sunk"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-paper-sunk text-zari-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-body font-medium text-ink">Email</span>
                  <span className="text-body-sm text-ink-muted">Send us an email</span>
                </span>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="flex flex-col gap-6 border border-line bg-paper-raised p-6 md:p-8">
            <h3 className="text-h3 text-ink">Send Message</h3>

            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-body-sm font-medium text-ink">
                  Name
                </label>
                <input type="text" id="name" className="field" placeholder="Your name" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-body-sm font-medium text-ink">
                  Email
                </label>
                <input type="email" id="email" className="field" placeholder="your@email.com" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-body-sm font-medium text-ink">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="field resize-y"
                  placeholder="Your message here..."
                ></textarea>
              </div>

              <button type="submit" className="btn mt-2 w-full">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

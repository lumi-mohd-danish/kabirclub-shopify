'use client';

const Contact = () => {
  return (
    <section className="bg-black py-8 sm:py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[95%] px-4 sm:px-6 md:max-w-[1000px]">
        {/* Header */}
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h2 className="font-lora text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#daa520]">
            Connect With Us
          </h2>
          <div className="mx-auto mt-3 sm:mt-4 h-1 w-16 sm:w-20 md:w-24 bg-gradient-to-r from-transparent via-[#daa520] to-transparent"></div>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {/* Contact Information */}
          <div className="rounded-lg border border-[#daa520]/20 bg-black/60 p-4 sm:p-6 md:p-8">
            <h3 className="mb-4 sm:mb-6 font-lora text-lg sm:text-xl md:text-2xl font-semibold text-[#daa520]">Get in Touch</h3>
            
            {/* Social Links */}
            <div className="space-y-4 sm:space-y-6">
              {/* WhatsApp */}
              <a 
                href="https://wa.me/917991812899" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 sm:gap-4 rounded-lg border border-[#daa520]/20 p-3 sm:p-4 transition-all hover:border-[#daa520] hover:bg-[#daa520]/10"
              >
                <div className="rounded-full bg-[#daa520]/10 p-2 sm:p-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#daa520" className="h-5 w-5 sm:h-6 sm:w-6">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-[#daa520]">WhatsApp</h4>
                  <p className="text-gray-300 text-sm sm:text-base">Chat with us instantly</p>
                </div>
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/kabirclub50" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 sm:gap-4 rounded-lg border border-[#daa520]/20 p-3 sm:p-4 transition-all hover:border-[#daa520] hover:bg-[#daa520]/10"
              >
                <div className="rounded-full bg-[#daa520]/10 p-2 sm:p-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#daa520" className="h-5 w-5 sm:h-6 sm:w-6">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-[#daa520]">Instagram</h4>
                  <p className="text-gray-300 text-sm sm:text-base">Follow us @kabirclub50</p>
                </div>
              </a>

              {/* Email */}
              <a 
                href="mailto:kabirclub50@gmail.com"
                className="flex items-center gap-3 sm:gap-4 rounded-lg border border-[#daa520]/20 p-3 sm:p-4 transition-all hover:border-[#daa520] hover:bg-[#daa520]/10"
              >
                <div className="rounded-full bg-[#daa520]/10 p-2 sm:p-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#daa520" className="h-5 w-5 sm:h-6 sm:w-6">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-[#daa520]">Email</h4>
                  <p className="text-gray-300 text-sm sm:text-base">Send us an email</p>
                </div>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-lg border border-[#daa520]/20 bg-black/60 p-4 sm:p-6 md:p-8">
            <h3 className="mb-4 sm:mb-6 font-lora text-lg sm:text-xl md:text-2xl font-semibold text-[#daa520]">Send Message</h3>
            
            <form className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full rounded-lg border border-[#daa520]/20 bg-black/40 p-2 sm:p-3 text-white focus:border-[#daa520] focus:outline-none focus:ring-1 focus:ring-[#daa520] text-sm sm:text-base"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full rounded-lg border border-[#daa520]/20 bg-black/40 p-2 sm:p-3 text-white focus:border-[#daa520] focus:outline-none focus:ring-1 focus:ring-[#daa520] text-sm sm:text-base"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea
                  id="message"
                  rows={3}
                  className="w-full rounded-lg border border-[#daa520]/20 bg-black/40 p-2 sm:p-3 text-white focus:border-[#daa520] focus:outline-none focus:ring-1 focus:ring-[#daa520] text-sm sm:text-base resize-y"
                  placeholder="Your message here..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#daa520] px-4 sm:px-6 py-2 sm:py-3 text-black font-semibold text-sm sm:text-base transition-all hover:bg-[#b38a1d] hover:scale-105"
              >
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
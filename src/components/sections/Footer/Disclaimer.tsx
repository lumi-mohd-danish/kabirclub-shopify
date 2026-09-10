const Disclaimer = () => {
  return (
    <div className="w-full border-y border-[#daa520]/30 bg-black/5 py-6">
      <div className="mx-auto max-w-[95%] md:max-w-[1200px]">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-black/80 to-black/90 p-5 shadow-lg">
          {/* Decorative elements */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#daa520] via-[#f5d76e] to-[#daa520]"></div>
          <div className="absolute bottom-0 right-0 h-16 w-16 rotate-45 bg-[#daa520]/10"></div>
          <div className="absolute -left-2 bottom-0 h-10 w-10 rounded-full bg-[#daa520]/5"></div>
          
          <h3 className="mb-3 font-lora text-xl font-semibold text-[#daa520]">Disclaimer</h3>
          
          <div className="space-y-3 text-sm leading-relaxed text-gray-300">
            <p>
              All product prices displayed on our website are in Indian Rupees (INR) and are inclusive of all taxes. 
              Prices are subject to change without prior notice.
            </p>
            <p>
              While we strive to provide accurate product information, images displayed may vary slightly from the actual product.
              Colors may appear differently based on your device display settings.
            </p>
            <p className="border-l-2 border-[#daa520] pl-3 italic">
              By using our services, you agree to our <span className="text-[#daa520]">Terms and Conditions</span> and 
               <span className="text-[#daa520]">Privacy Policy</span>.
            </p>
          </div>
          
          {/* Copyright line with decorative element */}
          <div className="mt-4 flex items-center border-t border-[#daa520]/20 pt-3 text-xs text-gray-400">
            <span className="inline-block h-3 w-3 rounded-full bg-[#daa520]/40 mr-2"></span>
            <span>© {new Date().getFullYear()} Kabirclub. All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;

export default function About() {
  return (
    <section data-landing="about"
      id="about"
      className="mx-auto site-width scroll-mt-28 px-5 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-20"
    >

      <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
        <p className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[#4267A8]">About Us</p>
        <h2 className="mx-auto mt-4 max-w-[640px] text-balance text-3xl font-black leading-[1.15] tracking-[-0.035em] text-[#142A52] sm:text-4xl lg:text-[44px]">
          A Jewish Education for Every Child
        </h2>
      </div>
      <div className="grid items-center gap-8 rounded-[28px] border border-[#E2E9F2] bg-gradient-to-br from-[#F5F8FC] to-[#FCFDFE] p-5 sm:gap-10 sm:rounded-[32px] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:p-10">

        {/* Left */}
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:py-3">
          <p className="text-lg font-medium leading-8 text-[#243E61] sm:text-xl sm:leading-9">
            Chinuch Yehudi helps Israeli families across the United States
            pursue a meaningful Jewish education with confidence.
          </p>
          <div aria-hidden="true" className="my-5 h-0.5 w-12 rounded-full bg-[#D8B34F]/70 sm:my-6" />
          <p className="text-base leading-[1.85] text-[#61728A]">
            By connecting families to scholarships, tuition assistance, and
            personalized guidance, we make Jewish day school a realistic
            option for families who want a strong Jewish foundation for their
            children.
          </p>

        </div>

        {/* Right */}

        <div className="relative min-w-0">
          <h3 className="mx-auto mb-4 max-w-lg text-balance text-center text-base font-semibold leading-6 text-[#243E61] sm:text-lg sm:leading-7">
            Rav Sholom Kamenetzky&apos;s Recent Trip to Florida
            <span className="mt-1 block text-sm font-normal text-[#61728A]">On behalf of Chinuch Yehudi</span>
          </h3>
          <div className="relative overflow-hidden rounded-[20px] border border-[#DCE5F1] bg-white shadow-[0_8px_24px_rgba(20,42,82,.07)]">
            <video
              className="aspect-video w-full bg-[#071628] object-contain"
              controls
              playsInline
              preload="metadata"
              aria-label="Chinuch Yehudi in action"
            >
              <source src="/app_video.mp4" type="video/mp4" />
              Your browser does not support embedded video.
            </video>



          </div>

        </div>

      </div>
    </section>
  );
}

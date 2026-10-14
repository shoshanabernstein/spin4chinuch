export default function About() {
  return (
    <section
      id="about"
      className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-6 pb-8"
    >

      <div className="grid items-center gap-10 lg:grid-cols-2">

        {/* Left */}
        <div>

          <h2 className="mt-6 text-4xl font-black leading-tight text-[#142A52] md:text-5xl">
            A Jewish Education
            <br />
            for Every Child
          </h2>

          <p className="mt-6 text-[22px] leading-9 text-slate-600">
            Chinuch Yehudi helps Israeli families across the United States
            pursue a meaningful Jewish education with confidence. By
            connecting families to scholarships, tuition assistance, and
            personalized guidance, we make Jewish day school a realistic
            option for families who want a strong Jewish foundation for their
            children.
          </p>

        </div>

        {/* Right */}

        <div className="relative">

          <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-2xl">

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

            <div className="border-t border-blue-100 bg-white p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-[#142A52] sm:text-3xl">
                Rav Sholom Kamenetzky&apos;s recent trip to Florida on behalf of Chinuch Yehudi
              </h3>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

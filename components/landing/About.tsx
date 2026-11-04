import AboutVideo from "./AboutVideo";

export default function About() {
  return (
    <section
      data-landing="about"
      id="about"
      className="mx-auto site-width scroll-mt-28 px-5 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-20"
    >

      <div data-about-heading className="mb-7 w-full sm:mb-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#4267A8]">About Us</p>
        <h2 className="mt-4 text-balance text-3xl font-black leading-[1.15] tracking-[-0.035em] text-[#142A52] sm:text-4xl">
          A Jewish Education for Every Child
        </h2>
      </div>
      <div data-about-layout className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div data-about-copy className="min-w-0 border-l-[3px] border-[#9cbcd9] pl-5 sm:pl-7">
          <div className="w-full max-w-xl">
            <p className="text-lg font-medium leading-8 text-[#243E61] sm:text-xl sm:leading-9">
              Chinuch Yehudi helps Israeli families across the United States
              give their children a strong Jewish foundation through a
              Jewish day school education.
            </p>
            <p className="mt-4 text-base leading-[1.85] text-[#61728A] sm:mt-5">
              We connect families with scholarships, tuition assistance, and
              personalized guidance, making that education more accessible
              and helping parents take the next step with confidence.
            </p>
          </div>
        </div>
        <div className="min-w-0 lg:pl-2">
          <AboutVideo />
        </div>
      </div>
    </section>
  );
}

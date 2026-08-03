import { GraduationCap, HeartHandshake, School } from "lucide-react";

export default function About() {
  return (
    <section
      id="about"
      className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-6 pb-16"
    >

      <div className="grid items-center gap-10 lg:grid-cols-2">

        {/* Left */}
        <div>

          <h2 className="mt-6 text-4xl font-black leading-tight text-[#142A52] md:text-5xl">
            Making Jewish Day School
            <br />
            Education Accessible
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Chinuch Yehudi helps Israeli families across the United States
            provide their children with a meaningful Jewish education. By
            guiding parents through scholarship opportunities, tuition
            assistance, and personalized support, the organization makes
            Jewish day school a realistic option for families who may not
            otherwise be able to afford it.
          </p>

          {/* Highlights */}

          <div className="mt-8 grid gap-5 sm:grid-cols-3">

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <School className="mb-3 text-[#4267A8]" size={28} />
              <h3 className="font-bold text-[#142A52]">
                Day Schools
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Helping families transition from public school to Jewish day
                schools.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <GraduationCap
                className="mb-3 text-[#4267A8]"
                size={28}
              />
              <h3 className="font-bold text-[#142A52]">
                Tuition Support
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Connecting families with scholarships, grants and financial
                assistance.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <HeartHandshake
                className="mb-3 text-[#4267A8]"
                size={28}
              />
              <h3 className="font-bold text-[#142A52]">
                Community
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Building lasting Jewish identity.
              </p>
            </div>

          </div>

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
                Every Child Deserves a Jewish Education
              </h3>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

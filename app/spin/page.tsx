"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PrizeWheel from "@/components/PrizeWheel/PrizeWheel";
import { supabase } from "@/lib/supabase";
import Confetti from "react-confetti";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";


type Outcome = {
  id: number;
  label: string;
  prize_id: number | null;
};


export default function SpinPage() {

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const [winner, setWinner] = useState("");

  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  const [loadingPrizes, setLoadingPrizes] = useState(true);

  const [remainingSpins, setRemainingSpins] = useState(0);

  const [showConfetti, setShowConfetti] = useState(false);


  const spinSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);



  useEffect(() => {

    loadOutcomes();

    loadRemainingSpins();

  }, []);





  async function loadOutcomes() {

    setLoadingPrizes(true);


    const { data, error } =
      await supabase
        .from("wheel_outcomes")
        .select(`
          id,
          label,
          prize_id
        `)
        .eq("active", true)
        .order("created_at", {
          ascending:true
        });



    if(error){

      console.error(error);

      setOutcomes([]);

    } else {

      setOutcomes(data || []);

    }


    setLoadingPrizes(false);

  }







  async function loadRemainingSpins() {


    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();



    if(!user) return;



    const { data, error } =
      await supabase
        .from("profiles")
        .select("remaining_spins")
        .eq("id", user.id)
        .single();



    if(error){

      console.error(error);

      return;

    }



    setRemainingSpins(
      data.remaining_spins
    );

  }







  async function spin() {


    if(
      spinning ||
      loadingPrizes
    ) return;




    if(outcomes.length === 0){

      alert(
        "No prizes are available right now."
      );

      return;

    }



    if(remainingSpins <= 0){

      alert(
        "You have no spins remaining."
      );

      return;

    }





    setSpinning(true);

    setWinner("");






    if(spinSound.current){

      spinSound.current.currentTime = 0;

      spinSound.current
        .play()
        .catch(()=>{});

    }







    const {
      data:{session}
    } = await supabase.auth.getSession();




    if(!session){

      alert("Please log in.");

      setSpinning(false);

      return;

    }








    const response =
      await fetch(
        "/api/spin",
        {

          method:"POST",

          headers:{

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,

          },

        }
      );





    const data =
      await response.json();






    if(!data.success){

      alert(data.error);

      setSpinning(false);

      return;

    }







    const index =
      outcomes.findIndex(
        (item)=>
          item.id === data.outcomeId
      );





    if(index === -1){

      alert(
        "Wheel changed. Please try again."
      );

      await loadOutcomes();

      setSpinning(false);

      return;

    }








    const sliceAngle =
      360 / outcomes.length;





    const targetRotation =
      rotation +
      360 * 8 +
      (
        360 -
        (
          index * sliceAngle +
          sliceAngle / 2
        )
      );





    setRotation(targetRotation);









    setTimeout(()=>{



      if(spinSound.current){

        spinSound.current.pause();

        spinSound.current.currentTime = 0;

      }





      if(winSound.current){

        winSound.current.currentTime = 0;

        winSound.current
          .play()
          .catch(()=>{});

      }







      setWinner(data.prize);

      setShowConfetti(true);

      setSpinning(false);



      loadOutcomes();

      loadRemainingSpins();






      setTimeout(()=>{

        setShowConfetti(false);

      },5000);





    },9000);





  }









  return (

    <ProtectedRoute>

      <>

        <Navbar />



        <main
          className="
          min-h-screen
          pt-24
          bg-[radial-gradient(circle_at_center,#1E3A8A_0%,#0F172A_60%,#020617_100%)]
          flex
          items-center
          justify-center
          overflow-hidden
          "
        >



          {
            showConfetti &&
            <Confetti
              recycle={false}
              numberOfPieces={400}
            />
          }






          <div
            className="
            max-w-7xl
            mx-auto
            px-8
            py-12
            flex
            flex-col
            items-center
            "
          >




            <h1
              className="
              text-5xl
              md:text-7xl
              font-black
              text-center
              text-white
              "
            >
              Spin to Win
            </h1>





            <p
              className="
              text-yellow-300
              text-xl
              md:text-2xl
              mt-5
              text-center
              font-bold
              "
            >
              Every Spin Could Win Big!
            </p>






            <div
              className="
              mt-6
              bg-white/10
              backdrop-blur-xl
              border
              border-yellow-400/50
              rounded-2xl
              px-8
              py-4
              text-center
              shadow-xl
              "
            >

              <p
                className="
                text-white
                text-lg
                font-bold
                "
              >
                🎡 Spins Remaining
              </p>


              <p
                className="
                text-yellow-400
                text-5xl
                font-black
                "
              >
                {remainingSpins}
              </p>

            </div>







            <div className="mt-10">

              <PrizeWheel
                rotation={rotation}
                spinning={spinning}
                prizes={outcomes}
              />

            </div>







            <button

              onClick={spin}

              disabled={
                spinning ||
                loadingPrizes ||
                outcomes.length === 0 ||
                remainingSpins <= 0
              }


              className="
              mt-14
              px-8
              md:px-16
              py-5
              md:py-6
              rounded-2xl
              text-2xl
              md:text-3xl
              font-black
              bg-gradient-to-r
              from-yellow-400
              to-yellow-600
              text-[#142A52]
              shadow-[0_0_40px_rgba(255,215,0,.6)]
              hover:scale-105
              transition
              disabled:opacity-50
              "
            >

              {
                loadingPrizes
                ? "LOADING..."
                : spinning
                ? "SPINNING..."
                : remainingSpins <= 0
                ? "NO SPINS LEFT"
                : "SPIN THE WHEEL"
              }


            </button>








            {
              winner &&

              <div
                className="
                mt-14
                bg-white/10
                backdrop-blur-xl
                border
                border-yellow-400
                rounded-3xl
                px-8
                md:px-12
                py-10
                shadow-2xl
                text-center
                animate-pulse
                text-white
                "
              >

                <h2
                  className="
                  text-4xl
                  md:text-5xl
                  font-black
                  text-yellow-300
                  "
                >
                  Congratulations!
                </h2>



                <p className="mt-6 text-2xl font-bold">
                  You won:
                </p>



                <p
                  className="
                  mt-4
                  text-4xl
                  md:text-5xl
                  font-black
                  text-yellow-400
                  "
                >
                  {winner}
                </p>




                <Link

                  href="/dashboard"

                  className="
                  inline-block
                  mt-8
                  bg-yellow-400
                  text-[#142A52]
                  font-bold
                  px-8
                  py-4
                  rounded-xl
                  hover:scale-105
                  transition
                  "

                >

                  Return to Dashboard

                </Link>


              </div>

            }





          </div>





          <audio
            ref={spinSound}
            src="/sounds/spin.mp3"
            preload="auto"
          />


          <audio
            ref={winSound}
            src="/sounds/win.mp3"
            preload="auto"
          />



        </main>


      </>

    </ProtectedRoute>

  );

}
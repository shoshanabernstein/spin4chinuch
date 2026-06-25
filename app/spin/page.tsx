"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

function Particles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                        left: Math.random() * 100 + "%",
                    }}
                    animate={{
                        y: [-50, 900],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                    }}
                />
            ))}
        </div>
    );
}

export default function SpinPage() {
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState("");
    const [prizes, setPrizes] = useState<any[]>([]);

    useEffect(() => {
        loadPrizes();
    }, []);

    async function loadPrizes() {
        const { data, error } = await supabase
            .from("prizes")
            .select("*")
            .eq("active", true)
            .gt("quantity", 0);

        console.log(data);
        console.log(error);

        setPrizes(data || []);
    }

    async function spin() {
        setSpinning(true);
        setWinner("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            alert("Please login");
            setSpinning(false);
            return;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("spins_remaining")
            .eq("id", user.id)
            .single();

        if (!profile || profile.spins_remaining <= 0) {
            alert("No spins remaining");
            setSpinning(false);
            return;
        }

        if (prizes.length === 0) {
            alert("No prizes available");
            setSpinning(false);
            return;
        }

        await new Promise((r) => setTimeout(r, 3000));

        const winningPrize =
            prizes[Math.floor(Math.random() * prizes.length)];

        const prize = winningPrize.name;

        await supabase
            .from("wins")
            .insert({
                user_id: user.id,
                user_email: user.email,
                prize,
            });

        await fetch("/api/send-win-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: user.email,
                prize,
            }),
        });

        await fetch("/api/send-win-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: user.email,
                prize,
            }),
        });

        await supabase
            .from("prizes")
            .update({
                quantity: winningPrize.quantity - 1,
            })
            .eq("id", winningPrize.id);

        await supabase
            .from("profiles")
            .update({
                spins_remaining: profile.spins_remaining - 1,
            })
            .eq("id", user.id);

        setWinner(prize);
        setSpinning(false);

        loadPrizes();
    }

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#faf7f0] p-8">
            <Particles />

            <div className="relative z-10 text-center">
                <img
                    src="/logo.png"
                    className="h-28 mx-auto"
                    alt="Logo"
                />

                <h1 className="mt-8 text-6xl font-black text-[#142A52]">
                    Spin. Support. Strengthen.
                </h1>

                <p className="mt-5 text-xl text-gray-600">
                    Every spin helps strengthen Jewish education.
                </p>

                <div className="mt-14 relative mx-auto w-96 h-96">
                    <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-3xl animate-pulse" />

                    <motion.div
                        animate={spinning ? { rotate: 1440 } : { rotate: 0 }}
                        transition={{ duration: 3 }}
                        className="relative w-full h-full rounded-full border-[18px] border-[#C9A44D]"
                        style={{
                            background: `conic-gradient(
                #142A52 0 60deg,
                #4267a8 60deg 120deg,
                #C9A44D 120deg 180deg,
                #6b46c1 180deg 240deg,
                #059669 240deg 300deg,
                #b91c1c 300deg
              )`,
                        }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white rounded-full w-40 h-40 flex items-center justify-center font-black text-[#142A52] shadow-xl">
                                SPIN
                            </div>
                        </div>
                    </motion.div>
                </div>

                <button
                    onClick={spin}
                    disabled={spinning}
                    className="mt-12 bg-blue-600 text-white px-8 py-4 rounded-xl text-xl"
                >
                    {spinning ? "Spinning..." : "Spin The Wheel"}
                </button>

                {winner && (
                    <div className="mt-10 bg-white rounded-3xl p-8 shadow-lg">
                        <h2 className="text-3xl font-black">
                            Winner!
                        </h2>

                        <p className="text-2xl mt-3 text-yellow-700 font-bold">
                            {winner}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
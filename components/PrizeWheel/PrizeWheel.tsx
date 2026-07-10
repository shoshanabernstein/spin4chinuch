"use client";

import { motion } from "framer-motion";
import WheelSlice from "./WheelSlice";
import { wheelColors } from "./colors";
import Lights from "./Lights";
import Pointer from "./Pointer";
import CenterButton from "./CenterButton";


type PrizeWheelProps = {
    rotation: number;
    spinning: boolean;
    canSpin: boolean;
    onSpin: () => void;
    prizes: { 
        id: number;
        label: string;
        prize_id: number | null;
    }[];
};


const SIZE = 900;
const CENTER = 450;
const RADIUS = 405;


export default function PrizeWheel({
    rotation,
    spinning,
    canSpin,
    onSpin,
    prizes,
}: PrizeWheelProps) {


    const slices = prizes.length || 8;

    const angle = 360 / slices;


    return (

        <div className="relative w-[min(86vw,620px)] drop-shadow-[0_30px_80px_rgba(0,0,0,.45)]">


            <Pointer spinning={spinning} />


            <motion.div
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.5, 0.9, 0.5],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 3,
                }}
                className="absolute inset-0 rounded-full bg-yellow-400/20 blur-3xl"
            />



            <motion.div
                animate={{
                    rotate: rotation,
                }}
                transition={{
                    duration: 9,
                    ease: [0.12,0.95,0.18,1],
                }}
            >


                <svg
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label="Prize wheel"
                >


                    <defs>

                        <radialGradient id="centerGlow">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </radialGradient>


                        <linearGradient id="goldRing" x1="0" x2="1">
                            <stop offset="0%" stopColor="#FDE68A" />
                            <stop offset="50%" stopColor="#D4AF37" />
                            <stop offset="100%" stopColor="#FDE68A" />
                        </linearGradient>



                        {wheelColors.map((color,i)=>(
                            <linearGradient
                                key={i}
                                id={`sliceGradient${i}`}
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="white" stopOpacity=".35"/>
                                <stop offset="15%" stopColor={color}/>
                                <stop offset="75%" stopColor={color}/>
                                <stop offset="100%" stopColor="black" stopOpacity=".35"/>
                            </linearGradient>
                        ))}



                        <filter id="wheelShadow">
                            <feDropShadow
                                dx="0"
                                dy="10"
                                stdDeviation="15"
                                floodOpacity="0.35"
                            />
                        </filter>



                        <linearGradient id="metalGold" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FFF8D6"/>
                            <stop offset="15%" stopColor="#F6D46A"/>
                            <stop offset="35%" stopColor="#B8860B"/>
                            <stop offset="50%" stopColor="#FFF5C3"/>
                            <stop offset="70%" stopColor="#C9981F"/>
                            <stop offset="100%" stopColor="#FFF8D6"/>
                        </linearGradient>



                        <radialGradient id="innerShadow">
                            <stop offset="70%" stopColor="transparent"/>
                            <stop offset="100%" stopColor="#000" stopOpacity=".35"/>
                        </radialGradient>


                    </defs>





                    <Lights />





                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={360}
                        fill="url(#metalGold)"
                        filter="url(#wheelShadow)"
                    />



                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={345}
                        fill="#111827"
                    />





                    {Array.from({length:slices}).map((_,i)=>(

                        <WheelSlice
                            key={i}
                            radius={RADIUS}
                            startAngle={i*angle}
                            endAngle={(i+1)*angle}
                            color={
                                wheelColors[
                                    i % wheelColors.length
                                ]
                            }
                            gradientIndex={
                                i % wheelColors.length
                            }
                        />

                    ))}






                    {Array.from({length:slices}).map((_,i)=>{

                        const angleDeg=i*angle;


                        return (

                            <line
                                key={i}
                                x1={CENTER}
                                y1={CENTER}
                                x2={
                                    CENTER +
                                    Math.cos(
                                        ((angleDeg-90)*Math.PI)/180
                                    ) *
                                    RADIUS
                                }
                                y2={
                                    CENTER +
                                    Math.sin(
                                        ((angleDeg-90)*Math.PI)/180
                                    ) *
                                    RADIUS
                                }
                                stroke="rgba(255,255,255,.35)"
                                strokeWidth="2"
                            />

                        );

                    })}







                    {Array.from({length:slices}).map((_,i)=>{


                        const label =
                            prizes[i]?.label || "Prize";


                        const textAngle =
                            i*angle + angle/2;



                        return (

                            <text
                                key={`label-${i}`}
                                x={CENTER}
                                y={CENTER-250}
                                fill="white"
                                fontSize="24"
                                fontWeight="900"
                                textAnchor="middle"
                                transform={
                                    `rotate(${textAngle} ${CENTER} ${CENTER})`
                                }
                            >

                                {
                                    label.length > 18
                                    ? `${label.slice(0,15)}...`
                                    : label
                                }

                            </text>

                        );


                    })}







                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={340}
                        fill="url(#innerShadow)"
                    />



                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={210}
                        fill="none"
                        stroke="url(#goldRing)"
                        strokeWidth="8"
                    />



                    <ellipse
                        cx={CENTER}
                        cy={220}
                        rx={240}
                        ry={100}
                        fill="white"
                        opacity="0.12"
                    />



                    <ellipse
                        cx={CENTER}
                        cy={CENTER-140}
                        rx="250"
                        ry="90"
                        fill="white"
                        opacity=".08"
                    />



                    <CenterButton spinning={spinning} canSpin={canSpin} onSpin={onSpin}/>



                </svg>


            </motion.div>


        </div>

    );

}
import Link from "next/link";
import Navbar from "../components/Navbar";
import {
  Gift,
  Heart,
  GraduationCap,
  Sparkles
} from "lucide-react";


export default function Home(){

return (

<>

<Navbar />


<main className="
min-h-screen
bg-[#faf7f0]
overflow-hidden
">


{/* HERO */}

<section className="
relative
px-8
py-24
">

<div className="
absolute
top-0
right-0
w-[500px]
h-[500px]
bg-yellow-200/30
rounded-full
blur-3xl
"/>



<div className="
max-w-6xl
mx-auto
grid
md:grid-cols-2
gap-16
items-center
">


<div>


<img

src="/logo.png"

className="
h-50
mb-10
"

/>


<h1 className="
text-6xl
font-black
leading-tight
text-[#142A52]
">


Spin.
Support.
<span className="
text-[#C9A44D]
">

Strengthen.

</span>


</h1>



<p className="
mt-8
text-xl
text-gray-600
leading-relaxed
">

Join Spin4Chinuch and help strengthen
Jewish education while enjoying exciting
prizes.

</p>



<div className="
mt-10
flex
gap-5
">


<Link

href="/spin"

className="
btn-main
"

>

Start Spinning

</Link>



<Link

href="/prizes"

className="
px-8
py-4
rounded-full
border
border-[#142A52]
font-bold
text-[#142A52]
hover:bg-white
transition
"

>

View Prizes

</Link>


</div>


</div>





{/* WHEEL PREVIEW */}

<div className="
relative
flex
justify-center
">


<div className="
absolute
w-80
h-80
bg-yellow-400/30
blur-3xl
rounded-full
animate-pulse
"/>



<div className="
relative
w-80
h-80
rounded-full
border-[18px]
border-[#C9A44D]
shadow-2xl

bg-gradient-to-br
from-[#142A52]
to-[#4267a8]

flex
items-center
justify-center

">


<div className="
w-40
h-40
rounded-full
bg-white
shadow-xl
flex
items-center
justify-center
font-black
text-[#142A52]
">

SPIN

</div>


</div>


</div>



</div>

</section>





{/* FEATURES */}

<section className="
px-8
py-20
">


<div className="
max-w-6xl
mx-auto
grid
md:grid-cols-3
gap-8
">


<div className="
glass
rounded-3xl
p-8
">

<Gift
className="
text-[#C9A44D]
w-12
h-12
"
/>


<h3 className="
mt-5
text-2xl
font-bold
">

Amazing Prizes

</h3>


<p className="mt-3 text-gray-600">

Gift cards, rewards, and special prizes.

</p>


</div>





<div className="
glass
rounded-3xl
p-8
">


<GraduationCap
className="
text-[#4267a8]
w-12
h-12
"
/>


<h3 className="
mt-5
text-2xl
font-bold
">

Support Chinuch

</h3>


<p className="mt-3 text-gray-600">

Every spin helps support Jewish education.

</p>


</div>





<div className="
glass
rounded-3xl
p-8
">


<Heart
className="
text-red-500
w-12
h-12
"
/>


<h3 className="
mt-5
text-2xl
font-bold
">

Make An Impact

</h3>


<p className="mt-3 text-gray-600">

Small actions create lasting change.

</p>


</div>



</div>


</section>






{/* HOW IT WORKS */}

<section className="
px-8
py-24
bg-white
">


<div className="
max-w-5xl
mx-auto
text-center
">


<Sparkles
className="
mx-auto
w-12
h-12
text-[#C9A44D]
"
/>



<h2 className="
text-5xl
font-black
mt-5
text-[#142A52]
">

How It Works

</h2>



<div className="
grid
md:grid-cols-3
gap-10
mt-16
">


<div>

<div className="
w-16
h-16
rounded-full
bg-[#142A52]
text-white
flex
items-center
justify-center
mx-auto
text-2xl
font-bold
">

1

</div>


<h3 className="mt-5 text-xl font-bold">

Choose Spins

</h3>


</div>




<div>

<div className="
w-16
h-16
rounded-full
bg-[#C9A44D]
flex
items-center
justify-center
mx-auto
text-2xl
font-bold
">

2

</div>


<h3 className="mt-5 text-xl font-bold">

Spin

</h3>


</div>





<div>

<div className="
w-16
h-16
rounded-full
bg-[#4267a8]
text-white
flex
items-center
justify-center
mx-auto
text-2xl
font-bold
">

3

</div>


<h3 className="mt-5 text-xl font-bold">

Win & Support

</h3>


</div>



</div>



</div>


</section>


</main>


</>

)

}
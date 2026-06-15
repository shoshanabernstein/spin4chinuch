import Link from "next/link";


export default function Navbar(){

return (

<nav className="
sticky top-0 z-50
bg-[#faf7f0]/80
backdrop-blur-xl
border-b border-yellow-200
">


<div className="
max-w-7xl
mx-auto
px-8
py-4
flex
justify-between
items-center
">


<Link href="/">

<img

src="/logo.png"

className="
h-16
w-auto
"

/>

</Link>



<div className="
flex
gap-8
items-center
">


<Link
href="/spin"
className="
font-bold
text-[#142A52]
hover:text-yellow-600
"
>
Spin
</Link>



<Link
href="/prizes"
className="
font-bold
text-[#142A52]
hover:text-yellow-600
"
>
Prizes
</Link>




<Link

href="/login"

className="
btn-main
py-3
px-7
"

>

Login

</Link>



</div>


</div>


</nav>

)

}
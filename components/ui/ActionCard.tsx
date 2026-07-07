import { ReactNode } from "react";
import Card from "./Card";
import Button from "./Button";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  icon: ReactNode;
}

export default function ActionCard({
  title,
  description,
  buttonText,
  href,
  icon,
}: ActionCardProps) {
  return (
    <Card
      className="
        overflow-hidden
        rounded-3xl
        bg-gradient-to-r
        from-[#4267A8]
        to-[#80A8F7]
        p-6
        text-white
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
      "
    >
      <div className="flex items-center justify-between gap-6">

        <div className="flex items-center gap-5">

          <div
            className="
              flex
              h-16
              w-16
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-white/20
              backdrop-blur
              text-white
            "
          >
            {icon}
          </div>


          <div>

            <h2 className="text-3xl font-bold leading-tight">
              {title}
            </h2>


            <p
              className="
                mt-1
                max-w-sm
                text-sm
                leading-6
                text-blue-100
              "
            >
              {description}
            </p>

          </div>

        </div>


        <Button
          href={href}
          variant="secondary"
          className="shrink-0"
        >
          {buttonText}
        </Button>


      </div>
    </Card>
  );
}
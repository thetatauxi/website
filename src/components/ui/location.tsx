import { PinContainer } from "../ui/3d-pin";


export function Location() {
    return (
        <section className="h-[40rem] w-full flex items-center justify-center flex-col">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold mb-8 text-center">Where are we located?</h2>
            </div>
            <PinContainer
                title="/google.com/maps"
                href="https://www.google.com/maps/place/1633+Monroe+St,+Madison,+WI+53711/@43.0651909,-89.4262828,14.5z/data=!4m6!3m5!1s0x8807acdcd3deaa2f:0xc01e3895e71db0ba!8m2!3d43.0662918!4d-89.414693!16s%2Fg%2F11c282dzwc?entry=ttu&g_ep=EgoyMDI0MTAwOS4wIKXMDSoASAFQAw%3D%3D"
            >
                <div className="flex basis-full flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem] ">
                    <h3 className="max-w-xs !pb-2 !m-0 font-bold  text-base text-slate-100">
                        Theta Tau House Location
                    </h3>
                    <div className="text-base !m-0 !p-0 font-normal">
                        <span className="text-slate-500 ">
                            1621 Engineering Drive, Madison, WI
                        </span>
                    </div>
                    <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=43.066519075696945,-89.41472518969684&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C43.066519075696945,-89.41472518969684&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                        alt="Theta Tau House Location"
                        className="flex flex-1 w-full rounded-lg mt-4 object-cover"
                    />
                </div>
            </PinContainer>
        </section>
    );
}

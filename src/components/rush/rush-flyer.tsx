import Image from "next/image"

export default function RushFlyer() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <section className="w-full py-12 md:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          {/* <div className="space-y-4 text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Rush Flyer</h2>
                        <p className="text-muted-foreground">
                            Check out our official rush flyer for all the details about our upcoming events and how to get involved.
                        </p>
                    </div> */}
          <div className="w-full overflow-hidden rounded-xl border border-blue-200/50 shadow-sm">
            <Image
              alt="Rush Flyer"
              src="/Fall25RushFlyer.jpeg"
              className="object-cover w-full"
              width={1920} // Full-width for large screens
              height={1080} // Adjust based on your aspect ratio
              style={{
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default function RushVideo() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Blueprint grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(30, 64, 175, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 64, 175, 0.3) 1px, transparent 1px)
          `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Geometric corner elements */}
      <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-700/20 rotate-45 z-0" />
      <div className="absolute top-20 right-20 w-24 h-24 border-2 border-blue-700/20 z-0" />
      <div className="absolute bottom-20 left-20 w-28 h-28 border-2 border-blue-700/20 rotate-12 z-0" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-blue-700/20 rotate-45 z-0" />

      {/* Technical drawing lines */}
      <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-700/20 to-transparent z-0" />
      <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-700/20 to-transparent z-0" />
      <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-700/20 to-transparent z-0" />
      <div className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-700/20 to-transparent z-0" />

      <section id="rush-video" className="w-full py-12 md:py-24 z-10 relative">
        <div className="mt-44">{/* Your next section content goes here */}</div>
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-black">
              Experience θΤ Rush
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Get a glimpse of what it's like to be part of Theta Tau. Watch our rush video and see why we're more than
              just a fraternity.
            </p>
            <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-xl border bg-muted">
              <iframe
                width="100%"
                height="100%"
                src="https://youtube.com/embed/LiI1dZDD_4g"
                title="Theta Tau Rush Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="text-sm text-muted-foreground">Watch our Fall 2025 Rush Video</p>
          </div>
        </div>
      </section>
    </div>
  )
}

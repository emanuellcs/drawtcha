import DrawtchaWidget from '@/components/DrawtchaWidget';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24 bg-gray-100">
      <div className="max-w-lg w-full text-center space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Drawtcha Demo
        </h1>
        <p className="text-lg text-gray-600">
          Prove you are human by drawing the requested object.
        </p>

        <div className="flex justify-center py-10">
          <DrawtchaWidget />
        </div>
        
        <div className="text-left bg-white p-6 rounded-lg shadow text-sm text-gray-600">
          <h3 className="font-bold mb-2">How it works:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>We use a <strong>CNN</strong> to check if your drawing looks like the object.</li>
            <li>We use an <strong>RNN</strong> to check if your stroke movements look human.</li>
            <li>Try drawing perfectly straight lines or drawing very slowly to see if you can trigger the bot detector!</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
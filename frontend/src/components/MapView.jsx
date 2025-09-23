export default function MapView() {
  return (
    <iframe
      title="Map"
      className="w-full h-full"
      src="https://www.google.com/maps/embed/v1/view?zoom=2&center=20,0&key=YOUR_GOOGLE_MAPS_API_KEY"
      allowFullScreen
    />
  );
}

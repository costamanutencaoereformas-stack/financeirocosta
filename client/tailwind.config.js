module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,html}"
  ],
  theme: {
    extend: {
      // Define a custom 'border' color to match the border-border utility
      colors: {
        border: "hsl(var(--border))"
      }
    }
  },
  plugins: []
}

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from './components/Navbar'
import Router from './Router'

const App = () => {
  return (
    <div>
      <Navbar/>
      <Router/>
    </div>
  )
}

export default App

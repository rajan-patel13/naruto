import React from 'react'
import { Route, Routes } from 'react-router-dom'
import TextInput from './components/TextInput'
import FileUpload from './components/FileUpload'
import LinkInput from './components/LinkInput'

const MainRoutes = () => {
  return (
    <Routes>
        <Route path='/' element={<TextInput/>}/>
        <Route path='/file' element={<FileUpload/>}/>
        <Route path='/link' element={<LinkInput/>}/>
    </Routes>
  )
}

export default MainRoutes

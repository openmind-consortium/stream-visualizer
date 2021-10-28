import React from 'react'
import { Link } from 'react-router-dom'

import styled from 'styled-components'

const LogoType = styled.h1`
  a {
    text-decoration: none;
  }
`
const Logo: React.FC = () => {
  return (<LogoType><Link to='/'>My RC+S</Link></LogoType>)
}

export default Logo

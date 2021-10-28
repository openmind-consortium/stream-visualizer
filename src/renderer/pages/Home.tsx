import React from 'react'

interface HomeProp {
  streamTimeDomains: any,
  endStream: any
}

const Home: React.FC<HomeProp> = ({streamTimeDomains,endStream}) => {
  

  return (
    <div>
      <h2>Home</h2>
      <ul>
        <li>
          <button onClick={()=>streamTimeDomains("left")}>Stream Left</button>
        </li>
        <li>
          <button onClick={endStream}>End Stream Left</button>
        </li>
        
      </ul>
    </div>
  )
}

export default Home

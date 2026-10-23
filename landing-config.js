/* Edit theme branches and theme-specific character introductions here.
   Person IDs and map-node IDs come from data.js. Run python3 build-local.py after editing.
   Climate connects directly to people; the other themes contain selectable branches. */
window.FutureLandingConfig = {
  background: 'future',
  researchImage: 'assets/research-board.jpg',
  themes: [
    {
      id: 'wealth', title: 'Wealth Gap', node: 'wealth', color: '#e6cb7c',
      prompt: 'Choose a household income group',
      groups: [
        {id: 'top-one', title: 'Top 1%', connections: [
          {person: 'leo', facet: 'work', blurb: 'Leo’s perspective connects wealth with running a business, choosing a home and accessing technology. Follow his work and home connections to explore who has more choices in this future.'}
        ]},
        {id: 'middle', title: 'Upper Middle to Middle Class', connections: [
          {person: 'catherine', facet: 'home', blurb: 'Follow Catherine’s home and health connections to explore how resources and access shape life in retirement.'},
          {person: 'veronica', facet: 'home', blurb: 'Explore opportunity through Veronica’s home, education and community connections. How does a household’s income shape the options available to a young person?'}
        ]},
        {id: 'lower', title: 'Lower Middle to Lower Class', connections: [
          {person: 'ken', facet: 'work', blurb: 'Ken’s work, home and climate connections bring resources and opportunity into the same picture. Follow these threads to consider the choices a household can make.'},
          {person: 'sophia', facet: 'home', blurb: 'Sophia’s connections bring the wealth gap into everyday questions of home, mobility and access to care. Explore how these systems reach different households.'}
        ]}
      ]
    },
    {
      id: 'geography', title: 'Rural / Suburb / City', node: 'geography', color: '#91b7ef',
      prompt: 'Choose a setting',
      groups: [
        {id: 'suburb', title: 'Suburb', connections: [
          {person: 'leo', facet: 'home', blurb: 'Start with Leo’s suburban home. Follow the links between where he lives, the resources available to him and the wider world around his household.'}
        ]},
        {id: 'urban', title: 'Urban', connections: [
          {person: 'catherine', facet: 'home', blurb: 'Explore an urban perspective through Catherine’s home, health and community connections. What does the city make possible, and how does she stay connected?'},
          {person: 'ken', facet: 'home', blurb: 'Follow Ken’s urban home connections into work, resources and climate. The same setting can hold very different everyday experiences.'}
        ]},
        {id: 'rural', title: 'Rural', connections: [
          {person: 'veronica', facet: 'home', blurb: 'Veronica’s rural community connects outward through learning and shared activities. Explore how technology links a small place with a larger world.'},
          {person: 'sophia', facet: 'work', blurb: 'Sophia’s rural perspective connects place with mobile health and medical robotics. Follow her work to explore how care can reach people beyond a city.'}
        ]}
      ]
    },
    {
      id: 'materials', title: 'Regional Matters', node: 'materials', color: '#9dcfbf',
      prompt: 'Choose a regional lens',
      groups: [
        {id: 'resources', title: 'Resource management', connections: [
          {node: 'materials', title: 'Resources across the region', blurb: 'Explore the existing regional materials connections to work, climate and the places people live.'}
        ]},
        {id: 'regional', title: 'Regional & satellite uniqueness', connections: [
          {node: 'geography', title: 'Different places, different needs', blurb: 'Use the world map to follow the connections between rural, suburban and urban settings, climate and everyday life.'}
        ]}
      ]
    },
    {
      id: 'climate', title: 'Climate Change', node: 'climate', color: '#e7a59b',
      connections: [
        {person: 'ken', facet: 'home', blurb: 'Ken is a refugee from the climate-endangered Marshall Islands. His perspective connects displacement, a new home and the resources needed to build a life.'},
        {person: 'veronica', facet: 'work', blurb: 'Veronica looks to science advocates and imagines a future in technology and robotics. Her learning goals connect with her hope for a world less prone to climate change.'},
        {person: 'leo', facet: 'home', blurb: 'Leo chose the Great Lakes as a climate haven for his home. Access to fresh water, clean air and resilient places also connects this story to the wealth gap.'}
      ]
    },
    {
      id: 'education', title: 'Education', color: '#bc9ee8',
      prompt: 'Choose a learning pathway',
      groups: [
        {id: 'k12', title: 'K–12', connections: [
          {person: 'veronica', facet: 'work', blurb: 'Veronica attends a local satellite schoolhouse, virtually connected to a larger school network in her rural area. Her ambitions in technology and robotics shape what she wants to learn next.'}
        ]},
        {id: 'technical', title: 'Technical / Associate’s Degree', connections: [
          {person: 'ken', facet: 'work', blurb: 'Through the Marine Corps, Ken earned an associate’s degree aligned with his professional experience in logistics and supply.'},
          {person: 'sophia', facet: 'work', blurb: 'Explore the technical and associate’s degree pathway through Sophia’s work as a robotic-assisted paramedic. Follow the links between practical training, medical robotics and delivering care.'}
        ]},
        {id: 'higher', title: 'Higher Education', connections: [
          {person: 'leo', facet: 'work', blurb: 'Leo holds a BA, while crediting experience and an entrepreneurial spirit for much of his professional success. He still encourages his children to pursue higher education.'},
          {person: 'catherine', facet: 'work', blurb: 'Catherine, a retired RN, values the college and nursing-school experience that helped shape her life’s work. She also sees the benefit of learning throughout life, beyond the teenage years and twenties.'}
        ]}
      ]
    }
  ]
};

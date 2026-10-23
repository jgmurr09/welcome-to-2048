// All characters use the shared Sophia profile. Existing descriptions take priority.
// Add your own portraits in data.js, and voice recordings / scene images here.
window.FutureCharacterConfig = {
  sophia: {
    layout: 'profile', format: 'Connected profile', lens: 'Care, closer to home',
    bio: 'Meet a life connected by care, mobility and the places we call home. Follow Sophia’s connections to see how the same future can feel different depending on access.',
    audio: null, audioTranscript: '', scene: null,
    stories: {
      work: 'What changes when medical assistance can travel to people? Explore Sophia’s work through mobile health, medical robotics and the resources needed to make care accessible.',
      home: 'A home is connected to much more than its walls. Location, a changing climate and the wealth gap shape the possibilities around Sophia’s everyday life.',
      tech: 'Mobile health units and medical robotics bring different kinds of support into this world. Follow a connection to consider who can use them and where they can reach.',
      health: 'Food and health are connected to where people live. Trace the links between climate, local access and growing food.',
      third: 'Life also happens between home and work. Explore the places and community connections that create room to meet, share and belong.'
    }
  },
  leo: {
    layout: 'profile', format: 'Connected profile', lens: 'A day, many connections',
    bio: 'Step through the different parts of Leo’s day. Work, home, health and community each open a different window onto the systems behind everyday life.',
    audio: null, audioTranscript: '', scene: null,
    stories: {
      work: 'Begin with work. Leo Trucking connects this life to regional materials, opportunity and Sophia. Follow those threads to explore how one person’s work reaches another person’s world.',
      home: 'Turn toward home. A health-tech kitchen and the possibility of a vacation connect everyday routines with larger questions of access.',
      tech: 'Look at what supports the day. Transport, materials and a connected kitchen bring different technologies into ordinary routines.',
      health: 'Pause for food and health. A connected kitchen, community nonprofit and changing climate offer three different paths into this part of Leo’s life.',
      third: 'Make room for life beyond work. Community participation connects Leo with Veronica and with the wider network around Leo Trucking.'
    }
  },
  ken: {
    accent: '#82baff',
    layout: 'profile', format: 'Connected profile', lens: 'The forces behind a life',
    bio: 'Look across Ken’s life at once. Each tile reveals another connection between resources, climate, opportunity and the choices a possible future makes available.',
    audio: null, audioTranscript: '', scene: null,
    stories: {
      work: 'Regional materials, climate and the wealth gap all connect with Ken’s work. Explore how resources and opportunity link individual lives to larger systems.',
      home: 'Home sits within a network of resources. Follow the links to climate, materials and the wealth gap to explore the forces around daily life.',
      tech: 'Technology opens another route through Ken’s world. Mixed reality, leisure and access are connected here; choose a thread to see its wider context.',
      health: 'Health has a material context. Climate, resources and opportunity offer different ways to explore how a future supports wellbeing.',
      third: 'Follow a shared vacation connection to Leo. A moment away from everyday routines also opens questions about opportunity and access.'
    }
  },
  veronica: {
    accent: '#f0a3d1',
    layout: 'profile', format: 'Connected profile', lens: 'A world built together',
    bio: 'Start with the people and interests around Veronica. Learning, volunteering and gardening connect one life to a larger community.',
    audio: null, audioTranscript: '', scene: null,
    stories: {
      work: 'Learning can be social. Mixed-reality glasses, shared gardening and Catherine create routes into Veronica’s work and education connections.',
      home: 'Home connects outward. Climate, location and a community nonprofit link private routines with the world around them.',
      tech: 'Mixed reality becomes a meeting place. Follow the glasses and gardening connections to explore how technology supports a shared interest.',
      health: 'Growing something together connects health with community. Trace the gardening, climate and Catherine connections around this part of Veronica’s life.',
      third: 'Community participation creates a bridge to Leo. Follow the nonprofit and gardening threads to explore where these lives meet.'
    }
  },
  catherine: {
    accent: '#c3b6df',
    layout: 'profile', format: 'Connected profile', lens: 'Small moments, wider worlds',
    bio: 'Explore Catherine’s world one chapter at a time. Follow the quiet connections between learning, wellbeing, friendship and the places that bring people together.',
    audio: null, audioTranscript: '', scene: null,
    stories: {
      work: 'Open a chapter on learning. Gardening, mixed-reality glasses and Veronica connect this part of Catherine’s life to people and opportunities beyond a single place.',
      home: 'Consider the setting around a life. Location, climate and the wealth gap connect Catherine’s home with the wider world.',
      tech: 'An everyday object can open another world. Follow Catherine’s and Veronica’s mixed-reality glasses to see how their technology connections overlap.',
      health: 'Wellbeing connects across lives. Gardening and climate lead toward Veronica’s health connections, offering another perspective on the same future.',
      third: 'Look for the places in between. Shared gardening connects Catherine with Veronica, while location shapes how those encounters can happen.'
    }
  }
};

/* Prototype content. Fill description fields to replace the lorem ipsum.
   Add character photos with portrait: "portraits/<name>.jpg". */
window.AtlasData = {
  "nodes": [
    {
      "id": "sophia",
      "type": "person",
      "name": "Sophia",
      "initial": "S",
      "portrait": null,
      "portraitPosition": "50% 35%",
      "color": "#7bc7e5",
      "x": 210,
      "y": 390,
      "description": ""
    },
    {
      "id": "leo",
      "type": "person",
      "name": "Leo",
      "initial": "L",
      "portrait": null,
      "portraitPosition": "50% 35%",
      "color": "#fed727",
      "x": 515,
      "y": 245,
      "description": ""
    },
    {
      "id": "ken",
      "type": "person",
      "name": "Ken",
      "initial": "K",
      "portrait": null,
      "portraitPosition": "50% 35%",
      "color": "#1282ca",
      "x": 885,
      "y": 320,
      "description": ""
    },
    {
      "id": "veronica",
      "type": "person",
      "name": "Veronica",
      "initial": "V",
      "portrait": null,
      "portraitPosition": "50% 35%",
      "color": "#e5018c",
      "x": 565,
      "y": 600,
      "description": ""
    },
    {
      "id": "catherine",
      "type": "person",
      "name": "Catherine",
      "initial": "C",
      "portrait": null,
      "portraitPosition": "50% 35%",
      "color": "#7d6b9d",
      "x": 875,
      "y": 680,
      "description": ""
    },
    {
      "id": "wealth",
      "type": "system",
      "name": "Wealth gap",
      "x": 180,
      "y": 100,
      "label": "Wealth gap",
      "related": [
        "sophia",
        "leo",
        "ken",
        "sophia-home",
        "leo-work"
      ],
      "description": ""
    },
    {
      "id": "materials",
      "type": "system",
      "name": "Regional materials",
      "x": 1035,
      "y": 105,
      "related": [
        "ken",
        "leo",
        "ken-work",
        "climate",
        "geography"
      ],
      "description": ""
    },
    {
      "id": "climate",
      "type": "system",
      "name": "Climate change",
      "x": 1030,
      "y": 505,
      "related": [
        "sophia",
        "leo",
        "ken",
        "veronica",
        "catherine",
        "geography",
        "materials"
      ],
      "description": ""
    },
    {
      "id": "geography",
      "type": "system",
      "name": "Rural / suburban / urban",
      "x": 175,
      "y": 675,
      "label": "Where you live",
      "related": [
        "sophia",
        "sophia-work",
        "veronica",
        "catherine",
        "climate"
      ],
      "description": ""
    },
    {
      "id": "trucking",
      "type": "shared",
      "name": "Leo Trucking",
      "x": 310,
      "y": 230,
      "related": [
        "sophia",
        "leo",
        "autonomous",
        "robotics",
        "climate",
        "leo-work"
      ],
      "description": ""
    },
    {
      "id": "vacation",
      "type": "shared",
      "name": "Vacation",
      "x": 775,
      "y": 155,
      "related": [
        "leo",
        "ken",
        "wealth",
        "climate",
        "leo-home",
        "ken-third"
      ],
      "description": ""
    },
    {
      "id": "volunteer",
      "type": "shared",
      "name": "Community nonprofit",
      "x": 515,
      "y": 425,
      "label": "Leo’s nonprofit",
      "related": [
        "leo",
        "veronica",
        "trucking",
        "gardening",
        "veronica-third"
      ],
      "description": ""
    },
    {
      "id": "gardening",
      "type": "shared",
      "name": "Online summer gardening",
      "x": 765,
      "y": 570,
      "label": "Summer gardening",
      "related": [
        "veronica",
        "catherine",
        "v-glasses",
        "c-glasses",
        "climate",
        "catherine-health"
      ],
      "description": ""
    },
    {
      "id": "autonomous",
      "type": "tech",
      "name": "Autonomous mobile health unit",
      "x": 65,
      "y": 480,
      "label": "Mobile health unit",
      "related": [
        "sophia",
        "robotics",
        "trucking",
        "climate",
        "sophia-work"
      ],
      "description": ""
    },
    {
      "id": "robotics",
      "type": "tech",
      "name": "Robotic medical assistance",
      "x": 235,
      "y": 565,
      "label": "Medical robotics",
      "related": [
        "sophia",
        "autonomous",
        "sophia-work",
        "sophia-tech"
      ],
      "description": ""
    },
    {
      "id": "kitchen",
      "type": "tech",
      "name": "Health-tech kitchen",
      "x": 525,
      "y": 85,
      "label": "Health-tech kitchen",
      "related": [
        "leo",
        "leo-health",
        "wealth",
        "trucking"
      ],
      "description": ""
    },
    {
      "id": "v-glasses",
      "type": "tech",
      "name": "Veronica’s mixed-reality glasses",
      "x": 520,
      "y": 745,
      "label": "Veronica’s glasses",
      "related": [
        "veronica",
        "gardening",
        "c-glasses",
        "veronica-tech"
      ],
      "description": ""
    },
    {
      "id": "c-glasses",
      "type": "tech",
      "name": "Catherine’s mixed-reality glasses",
      "x": 1015,
      "y": 745,
      "label": "Catherine’s glasses",
      "related": [
        "catherine",
        "gardening",
        "v-glasses",
        "wealth",
        "catherine-work"
      ],
      "description": ""
    },
    {
      "id": "sophia-work",
      "type": "facet",
      "name": "Work, income & education",
      "person": "sophia",
      "key": "work",
      "label": "Work & learning",
      "related": [
        "robotics",
        "autonomous",
        "trucking",
        "wealth"
      ],
      "description": ""
    },
    {
      "id": "sophia-home",
      "type": "facet",
      "name": "Home & family",
      "person": "sophia",
      "key": "home",
      "label": "Home & family",
      "related": [
        "wealth",
        "geography",
        "climate"
      ],
      "description": ""
    },
    {
      "id": "sophia-tech",
      "type": "facet",
      "name": "Technology",
      "person": "sophia",
      "key": "tech",
      "label": "Technology",
      "related": [
        "autonomous",
        "robotics",
        "wealth",
        "climate"
      ],
      "description": ""
    },
    {
      "id": "sophia-health",
      "type": "facet",
      "name": "Food & health",
      "person": "sophia",
      "key": "health",
      "label": "Food & health",
      "related": [
        "climate",
        "geography",
        "gardening"
      ],
      "description": ""
    },
    {
      "id": "sophia-third",
      "type": "facet",
      "name": "Third places",
      "person": "sophia",
      "key": "third",
      "label": "Third places",
      "related": [
        "geography",
        "volunteer",
        "sophia-health"
      ],
      "description": ""
    },
    {
      "id": "leo-work",
      "type": "facet",
      "name": "Work, income & education",
      "person": "leo",
      "key": "work",
      "label": "Work & learning",
      "related": [
        "trucking",
        "wealth",
        "materials",
        "sophia"
      ],
      "description": ""
    },
    {
      "id": "leo-home",
      "type": "facet",
      "name": "Home & family",
      "person": "leo",
      "key": "home",
      "label": "Home & family",
      "related": [
        "wealth",
        "vacation",
        "kitchen"
      ],
      "description": ""
    },
    {
      "id": "leo-tech",
      "type": "facet",
      "name": "Technology",
      "person": "leo",
      "key": "tech",
      "label": "Technology",
      "related": [
        "trucking",
        "kitchen",
        "materials"
      ],
      "description": ""
    },
    {
      "id": "leo-health",
      "type": "facet",
      "name": "Food & health",
      "person": "leo",
      "key": "health",
      "label": "Food & health",
      "related": [
        "kitchen",
        "volunteer",
        "climate"
      ],
      "description": ""
    },
    {
      "id": "leo-third",
      "type": "facet",
      "name": "Third places",
      "person": "leo",
      "key": "third",
      "label": "Third places",
      "related": [
        "volunteer",
        "trucking",
        "veronica"
      ],
      "description": ""
    },
    {
      "id": "ken-work",
      "type": "facet",
      "name": "Work, income & education",
      "person": "ken",
      "key": "work",
      "label": "Work & learning",
      "related": [
        "materials",
        "wealth",
        "climate",
        "leo"
      ],
      "description": ""
    },
    {
      "id": "ken-home",
      "type": "facet",
      "name": "Home & family",
      "person": "ken",
      "key": "home",
      "label": "Home & family",
      "related": [
        "climate",
        "wealth",
        "materials"
      ],
      "description": ""
    },
    {
      "id": "ken-tech",
      "type": "facet",
      "name": "Technology",
      "person": "ken",
      "key": "tech",
      "label": "Technology",
      "related": [
        "wealth",
        "vacation",
        "c-glasses"
      ],
      "description": ""
    },
    {
      "id": "ken-health",
      "type": "facet",
      "name": "Food & health",
      "person": "ken",
      "key": "health",
      "label": "Food & health",
      "related": [
        "climate",
        "materials",
        "wealth"
      ],
      "description": ""
    },
    {
      "id": "ken-third",
      "type": "facet",
      "name": "Third places",
      "person": "ken",
      "key": "third",
      "label": "Third places",
      "related": [
        "vacation",
        "leo",
        "wealth"
      ],
      "description": ""
    },
    {
      "id": "veronica-work",
      "type": "facet",
      "name": "Work, income & education",
      "person": "veronica",
      "key": "work",
      "label": "Work & learning",
      "related": [
        "gardening",
        "v-glasses",
        "catherine",
        "wealth"
      ],
      "description": ""
    },
    {
      "id": "veronica-home",
      "type": "facet",
      "name": "Home & family",
      "person": "veronica",
      "key": "home",
      "label": "Home & family",
      "related": [
        "climate",
        "volunteer",
        "geography"
      ],
      "description": ""
    },
    {
      "id": "veronica-tech",
      "type": "facet",
      "name": "Technology",
      "person": "veronica",
      "key": "tech",
      "label": "Technology",
      "related": [
        "v-glasses",
        "c-glasses",
        "gardening"
      ],
      "description": ""
    },
    {
      "id": "veronica-health",
      "type": "facet",
      "name": "Food & health",
      "person": "veronica",
      "key": "health",
      "label": "Food & health",
      "related": [
        "gardening",
        "climate",
        "catherine"
      ],
      "description": ""
    },
    {
      "id": "veronica-third",
      "type": "facet",
      "name": "Third places",
      "person": "veronica",
      "key": "third",
      "label": "Third places",
      "related": [
        "volunteer",
        "leo",
        "gardening"
      ],
      "description": ""
    },
    {
      "id": "catherine-work",
      "type": "facet",
      "name": "Work, income & education",
      "person": "catherine",
      "key": "work",
      "label": "Work & learning",
      "related": [
        "gardening",
        "c-glasses",
        "wealth",
        "veronica"
      ],
      "description": ""
    },
    {
      "id": "catherine-home",
      "type": "facet",
      "name": "Home & family",
      "person": "catherine",
      "key": "home",
      "label": "Home & family",
      "related": [
        "climate",
        "geography",
        "wealth"
      ],
      "description": ""
    },
    {
      "id": "catherine-tech",
      "type": "facet",
      "name": "Technology",
      "person": "catherine",
      "key": "tech",
      "label": "Technology",
      "related": [
        "c-glasses",
        "v-glasses",
        "wealth"
      ],
      "description": ""
    },
    {
      "id": "catherine-health",
      "type": "facet",
      "name": "Food & health",
      "person": "catherine",
      "key": "health",
      "label": "Food & health",
      "related": [
        "gardening",
        "climate",
        "veronica-health"
      ],
      "description": ""
    },
    {
      "id": "catherine-third",
      "type": "facet",
      "name": "Third places",
      "person": "catherine",
      "key": "third",
      "label": "Third places",
      "related": [
        "gardening",
        "veronica",
        "geography"
      ],
      "description": ""
    }
  ],
  "edges": [
    {
      "a": "wealth",
      "b": "sophia",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "wealth",
      "b": "leo",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "materials",
      "b": "leo",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "materials",
      "b": "ken",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "climate",
      "b": "sophia",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "climate",
      "b": "leo",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "climate",
      "b": "ken",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "climate",
      "b": "veronica",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "climate",
      "b": "catherine",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "geography",
      "b": "sophia",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "trucking",
      "b": "sophia",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "trucking",
      "b": "leo",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "vacation",
      "b": "leo",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "vacation",
      "b": "ken",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "volunteer",
      "b": "leo",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "volunteer",
      "b": "veronica",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "gardening",
      "b": "veronica",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "gardening",
      "b": "catherine",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "autonomous",
      "b": "sophia",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "robotics",
      "b": "sophia",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "kitchen",
      "b": "leo",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "v-glasses",
      "b": "veronica",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "c-glasses",
      "b": "catherine",
      "source": "board",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia",
      "b": "sophia-work",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-work",
      "b": "robotics",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-work",
      "b": "autonomous",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-work",
      "b": "trucking",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-work",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia",
      "b": "sophia-home",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-home",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-home",
      "b": "geography",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-home",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia",
      "b": "sophia-tech",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-tech",
      "b": "autonomous",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-tech",
      "b": "robotics",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-tech",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-tech",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia",
      "b": "sophia-health",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-health",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-health",
      "b": "geography",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-health",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia",
      "b": "sophia-third",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-third",
      "b": "geography",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-third",
      "b": "volunteer",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "sophia-third",
      "b": "sophia-health",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo",
      "b": "leo-work",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-work",
      "b": "trucking",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-work",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-work",
      "b": "materials",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-work",
      "b": "sophia",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo",
      "b": "leo-home",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-home",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-home",
      "b": "vacation",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-home",
      "b": "kitchen",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo",
      "b": "leo-tech",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-tech",
      "b": "trucking",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-tech",
      "b": "kitchen",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-tech",
      "b": "materials",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo",
      "b": "leo-health",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-health",
      "b": "kitchen",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-health",
      "b": "volunteer",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-health",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo",
      "b": "leo-third",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-third",
      "b": "volunteer",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-third",
      "b": "trucking",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "leo-third",
      "b": "veronica",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken",
      "b": "ken-work",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-work",
      "b": "materials",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-work",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-work",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-work",
      "b": "leo",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken",
      "b": "ken-home",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-home",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-home",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-home",
      "b": "materials",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken",
      "b": "ken-tech",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-tech",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-tech",
      "b": "vacation",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-tech",
      "b": "c-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken",
      "b": "ken-health",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-health",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-health",
      "b": "materials",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-health",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken",
      "b": "ken-third",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-third",
      "b": "vacation",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-third",
      "b": "leo",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "ken-third",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica",
      "b": "veronica-work",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-work",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-work",
      "b": "v-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-work",
      "b": "catherine",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-work",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica",
      "b": "veronica-home",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-home",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-home",
      "b": "volunteer",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-home",
      "b": "geography",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica",
      "b": "veronica-tech",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-tech",
      "b": "v-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-tech",
      "b": "c-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-tech",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica",
      "b": "veronica-health",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-health",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-health",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-health",
      "b": "catherine",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica",
      "b": "veronica-third",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-third",
      "b": "volunteer",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-third",
      "b": "leo",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "veronica-third",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine",
      "b": "catherine-work",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-work",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-work",
      "b": "c-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-work",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-work",
      "b": "veronica",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine",
      "b": "catherine-home",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-home",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-home",
      "b": "geography",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-home",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine",
      "b": "catherine-tech",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-tech",
      "b": "c-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-tech",
      "b": "v-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-tech",
      "b": "wealth",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine",
      "b": "catherine-health",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-health",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-health",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-health",
      "b": "veronica-health",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine",
      "b": "catherine-third",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-third",
      "b": "gardening",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-third",
      "b": "veronica",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "catherine-third",
      "b": "geography",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "wealth",
      "b": "ken",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "wealth",
      "b": "catherine",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "materials",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "gardening",
      "b": "climate",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "trucking",
      "b": "autonomous",
      "source": "expanded",
      "label": "",
      "description": ""
    },
    {
      "a": "v-glasses",
      "b": "c-glasses",
      "source": "expanded",
      "label": "",
      "description": ""
    }
  ],
  "facetLabels": {
    "work": "Work & learning",
    "home": "Home & family",
    "tech": "Technology",
    "health": "Food & health",
    "third": "Third places"
  },
  "boardCount": 18,
  "year": 2048
};

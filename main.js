const clientId = "mYfmdijXe74V18NoARal-A";
const clientSecret = "WV2BgUuyzbqH_efs0gZNI9KCK88SXQ";

async function fetchPosts() {
  const response = await fetch(
    "https://www.reddit.com/r/unstable_diffusion/top.json?t=all&limit=60",
  );
  const data = await response.json();

  // Exclude stickied posts
  const nonStickiedPosts = data.data.children.filter(
    (post) => !post.data.stickied,
  );

  return nonStickiedPosts;
}

function filterValidPosts(posts) {
  return posts.filter(
    (post) =>
      post.data.title &&
      post.data.url &&
      post.data.url.startsWith("http") &&
      post.data.url.includes(".gif") &&
      post.data.url.includes("v.redd.it") &&
      post.data.self && // Exclude self-posts
      !post.data.removed, // Exclude deleted posts
  );
}

function convertToDirectLink(redditMediaLink) {
  const url = new URL(redditMediaLink);

  // Check if it's a Reddit preview link
  if (url.hostname === "preview.redd.it") {
    const [mediaId, format] = url.pathname.split("/").pop().split(".");

    if (mediaId && format) {
      // Build the direct link
      return `https://i.redd.it/${mediaId}.${format}`;
    }
  }

  // If it's not a Reddit preview link, return the original link
  return redditMediaLink;
}

// ...

// Function to render posts as cards on the webpage
async function renderPosts(posts) {
  const container = document.getElementById("postsContainer");
  container.innerHTML = "";

  for (let i = 0; i < posts.length; i += 3) {
    const row = document.createElement("div");
    row.classList.add("row");

    for (let j = i; j < i + 3 && j < posts.length; j++) {
      const post = posts[j];

      const card = document.createElement("div");
      card.classList.add("card");
      const cardContent = document.createElement("div");
      cardContent.classList.add("card-content");

      let customClass = "";
      let swiperStart = `
        <!-- Slider main container -->
        <div class="swiper">
            <!-- Additional required wrapper -->
          <div class="swiper-wrapper">
          <!-- Slides -->
      `;
      let swiperContent = "";
      let swiperEnd = `
            </div>
            <!-- If we need pagination -->
                <div class="swiper-pagination"></div>
          <!-- If we need scrollbar -->
          <div class="swiper-scrollbar"></div>
        </div>
      `;
      if (post.data.is_gallery) {
        // Handle Reddit galleries
        if (post.data.media_metadata) {
          customClass = " gallery-post";
          // Iterate over media_metadata to get direct links
          for (const mediaId in post.data.media_metadata) {
            const galleryImage = post.data.media_metadata[mediaId];
            const directLink = convertToDirectLink(galleryImage.s.u); // Use the s.u field for direct link
            swiperContent +=
              `
                <div class="swiper-slide">
                <img alt="` +
              post.data.title +
              `" src="` +
              directLink +
              `">
              </div>
            `;
          }

          const divElem = document.createElement("DIV");
          divElem.innerHTML = swiperStart + swiperContent + swiperEnd;
          cardContent.appendChild(divElem);
          cardContent.className += customClass;
        }
      } else if (post.data.url) {
        // Handle posts with a single image or external links
        const image = document.createElement("img");
        image.src = await convertToDirectLink(post.data.url);
        image.alt = post.data.title;
        cardContent.appendChild(image);
      }

      cardContent.innerHTML += `<h3>${post.data.title}</h3>`;
      card.appendChild(cardContent);
      row.appendChild(card);
    }

    container.appendChild(row);
  }

  initSwiper();
}

async function fetchAndRenderNewPosts() {
  try {
    const posts = await fetchPosts();
    const validPosts = filterValidPosts(posts);

    if (validPosts.length > 0) {
      renderPosts(validPosts);
    } else {
      console.warn("No valid posts fetched. Trying again with new posts.");
      const newPosts = await fetchPosts();
      renderPosts(newPosts);
    }
  } catch (error) {
    console.error("Error fetching or rendering posts:", JSON.stringify(error));
  }
}

window.onload = function () {
  fetchAndRenderNewPosts();
};

function initSwiper() {
  if (document.querySelectorAll(".gallery-post").length > 0) {
    console.log("I'm in....");
    const swiper = new Swiper(".swiper", {
      // Optional parameters
      direction: "horizontal",
      loop: true,

      // If we need pagination
      pagination: {
        el: ".swiper-pagination",
        dynamicBullets: true,
      },
    });
  } else {
    console.log("I'm not in :(");
  }
}

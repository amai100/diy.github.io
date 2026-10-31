/* =========================================================
   Project archive — edit the `projects` array to add a work.
   ========================================================= */

(() => {
  "use strict";

  const projects = [
    {
      id: "pingpong",
      index: "01",
      year: "2026",
      title: "乒乓球发球机",
      category: "机器人 / 嵌入式",
      summary:
        "自制乒乓球发球机，支持上旋、下旋、直球三种球路，可调节发球速度与频率。采用 STM32 控制，配合舵机与直流电机实现精准发球。",
      description:
        "从结构建模、3D 打印到控制程序，完整走了一遍发球机的制作流程。机器支持上旋、下旋、直球三种发球模式，发球速度与频率可调，并配有触摸屏完成全部操作。目前仍在持续迭代结构和发球稳定性。",
      tags: ["STM32", "舵机云台", "触摸屏", "3D 打印", "直流电机"],
      cover: "assets/img/works/pingpong-blueprint.svg",
      coverAlt: "乒乓球发球机结构示意图",
      gallery: [
        {
          src: "assets/img/works/pingpong-blueprint.svg",
          label: "结构示意",
          alt: "乒乓球发球机结构示意图：供球漏斗、摩擦发射轮、舵机云台与触摸屏控制"
        },
        {
          src: "assets/img/works/pingpong-panel.webp",
          label: "控制界面",
          alt: "发球机触摸屏控制界面实拍：向上、向下、向左、向右、复位、供球、停止发球以及上旋球、下旋球、直球等按钮"
        }
      ],
      specs: [
        ["主控", "STM32"],
        ["球路", "上旋 / 下旋 / 直球"],
        ["调节", "速度与频率可调"],
        ["操作", "触摸屏"]
      ],
      links: [
        {
          label: "看第一代演示视频",
          href: "https://www.bilibili.com/video/BV1b6Lg6SEAa/",
          primary: true
        },
        { label: "B 站主页", href: "https://space.bilibili.com/3494354003954471" }
      ],
      note: "控制界面为实拍；结构图为概念示意，用于说明主要组成，不代表最终工程结构。"
    }
  ];

  const list = document.getElementById("archiveList");
  const dialog = document.getElementById("projectDialog");

  function render() {
    if (!list) return;

    list.innerHTML = projects
      .map(
        (project) => `
          <a class="archive-card reveal" id="${project.id}" href="#${project.id}"
             data-project="${project.id}" aria-haspopup="dialog" data-spotlight>
            <div class="archive-index">
              <span>${project.index}</span>
              <span class="dot" aria-hidden="true"></span>
            </div>
            <div class="archive-thumb">
              <img src="${project.cover}" alt="${project.coverAlt}" width="800" height="600" loading="lazy" />
            </div>
            <div class="archive-body">
              <p class="kicker">${project.category} / ${project.year}</p>
              <h2>${project.title}</h2>
              <p>${project.summary}</p>
              <ul class="tag-list" aria-label="项目标签">
                ${project.tags.map((tag) => `<li>${tag}</li>`).join("")}
              </ul>
              <div class="archive-foot">
                <span class="muted" style="font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em">PROJECT ${project.index}</span>
                <span class="open">查看项目详情 <span aria-hidden="true">→</span></span>
              </div>
            </div>
          </a>
        `
      )
      .join("");

    list.querySelectorAll("[data-project]").forEach((card) => {
      card.addEventListener("click", (event) => {
        event.preventDefault();
        openProject(card.dataset.project);
      });
    });
  }

  let activeProject = null;

  function setImage(index) {
    if (!activeProject || !dialog) return;
    const item = activeProject.gallery[index];
    if (!item) return;

    const image = dialog.querySelector("#pdImage");
    image.src = item.src;
    image.alt = item.alt;

    dialog.querySelectorAll("#pdThumbs button").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.index) === index));
    });
  }

  function openProject(id) {
    if (!dialog) return;
    const project = projects.find((item) => item.id === id);
    if (!project) return;

    activeProject = project;

    dialog.querySelector("#pdKicker").textContent =
      `PROJECT / ${project.index} · ${project.category} · ${project.year}`;
    dialog.querySelector("#pdTitle").textContent = project.title;
    dialog.querySelector("#pdDesc").textContent = project.description;
    dialog.querySelector("#pdTags").innerHTML = project.tags
      .map((tag) => `<li>${tag}</li>`)
      .join("");
    dialog.querySelector("#pdSpecs").innerHTML = project.specs
      .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`)
      .join("");

    const thumbs = dialog.querySelector("#pdThumbs");
    thumbs.innerHTML = project.gallery
      .map(
        (item, index) => `
          <button type="button" data-index="${index}" aria-pressed="${index === 0}" aria-label="查看${item.label}">
            <img src="${item.src}" alt="" />
          </button>
        `
      )
      .join("");
    thumbs.hidden = project.gallery.length < 2;
    thumbs.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => setImage(Number(button.dataset.index)));
    });

    const note = dialog.querySelector("#pdNote");
    note.textContent = project.note || "";
    note.hidden = !project.note;

    dialog.querySelector("#pdLinks").innerHTML = project.links
      .map(
        (link) => `
          <a class="btn ${link.primary ? "btn-primary" : "btn-secondary"}"
             href="${link.href}" target="_blank" rel="noopener noreferrer">
            ${link.label} <span class="arrow" aria-hidden="true">↗</span>
          </a>
        `
      )
      .join("");

    setImage(0);
    dialog.showModal();
    dialog.querySelector(".pd-body").scrollTop = 0;
  }

  render();

  document.querySelectorAll("[data-project-count]").forEach((node) => {
    node.textContent = String(projects.length).padStart(2, "0");
  });
  document.querySelectorAll("[data-project-index]").forEach((node) => {
    node.textContent = `ARCHIVE / ${String(projects.length).padStart(2, "0")}`;
  });

  // Deep link from the home page: works.html#pingpong
  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("is-target");
        window.setTimeout(() => target.classList.remove("is-target"), 2400);
      }, 180);
    }
  }
})();

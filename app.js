import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =========================================
   FIREBASE
========================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyDOoYZZhaTn6hbBQ0ml--mq8ByT0KdF9e0",

  authDomain:
    "el-patron-de-las-ofertas.firebaseapp.com",

  projectId:
    "el-patron-de-las-ofertas",

  storageBucket:
    "el-patron-de-las-ofertas.firebasestorage.app",

  messagingSenderId:
    "996329026447",

  appId:
    "1:996329026447:web:46eba80378d58de587d1fa",

  measurementId:
    "G-1LYNHBZVDM"
};


const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);


/* =========================================
   VARIABLES
========================================= */

let cupones = [];

let categoriaActual =
  "relampagos";


/* =========================================
   HELPERS
========================================= */

const $ = id =>
  document.getElementById(id);


function fechaHoy() {

  const d = new Date();

  const year =
    d.getFullYear();

  const month =
    String(d.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(d.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function escapar(texto) {

  return String(texto ?? "")
    .replace(/[&<>"']/g, caracter => {

      const mapa = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      };

      return mapa[caracter];

    });

}


/* =========================================
   IDENTIFICADOR DEL VISITANTE
========================================= */

function obtenerVisitanteId() {

  let id =
    localStorage.getItem(
      "patron_visitante_id"
    );

  if (!id) {

    id =
      crypto.randomUUID();

    localStorage.setItem(
      "patron_visitante_id",
      id
    );

  }

  return id;
}


/* =========================================
   REGISTRAR VISITA
   UNA VEZ POR DÍA
========================================= */

async function registrarVisita() {

  try {

    const dia =
      fechaHoy();

    const visitante =
      obtenerVisitanteId();

    const clave =
      `${visitante}_${dia}`;

    const referencia =
      doc(
        db,
        "visitas",
        clave
      );


    const existente =
      await getDoc(referencia);


    if (existente.exists()) {

      return;

    }


    await setDoc(
      referencia,
      {

        visitanteId:
          visitante,

        dia:
          dia,

        fecha:
          Date.now(),

        userAgent:
          navigator.userAgent

      }
    );


  } catch(error) {

    console.error(
      "Error registrando visita:",
      error
    );

  }

}


/* =========================================
   CATEGORÍAS
========================================= */

async function cargarCategorias() {

  const contenedor =
    $("categories");

  contenedor.innerHTML = "";


  try {

    const q =
      query(
        collection(
          db,
          "categorias"
        ),
        orderBy("orden")
      );


    const resultado =
      await getDocs(q);


    resultado.forEach(
      documento => {

        const categoria =
          documento.data();


        const enlace =
          document.createElement("a");


        enlace.className =
          "category";


        enlace.href =
          categoria.link || "#";


        enlace.target =
          "_blank";


        enlace.rel =
          "noopener";


        enlace.innerHTML = `

          ${
            categoria.imagen
              ? `
                <img
                  src="${escapar(categoria.imagen)}"
                  alt=""
                >
              `
              : ""
          }

          <span>
            ${escapar(
              categoria.nombre ||
              "Categoría"
            )}
          </span>

        `;


        contenedor.appendChild(
          enlace
        );

      });


  } catch(error) {

    console.error(
      "Error categorías:",
      error
    );

  }

}


/* =========================================
   OFERTAS
========================================= */

async function cargarOfertas() {

  const contenedor =
    $("offers");

  contenedor.innerHTML = "";


  try {

    const q =
      query(
        collection(
          db,
          "ofertas"
        ),
        orderBy("orden")
      );


    const resultado =
      await getDocs(q);


    resultado.forEach(
      documento => {

        const oferta =
          documento.data();


        const enlace =
          document.createElement("a");


        enlace.className =
          "offer-card";


        enlace.href =
          oferta.link || "#";


        enlace.target =
          "_blank";


        enlace.rel =
          "noopener";


        enlace.innerHTML = `

          <div class="offer-image">

            ${
              oferta.imagen
                ? `
                  <img
                    src="${escapar(
                      oferta.imagen
                    )}"
                    alt=""
                  >
                `
                : "🔥"
            }

          </div>


          <div class="offer-info">

            <div class="offer-title">

              ${escapar(
                oferta.titulo ||
                "Oferta"
              )}

            </div>


            <div class="offer-price">

              $${Number(
                oferta.precioActual || 0
              ).toLocaleString(
                "es-MX"
              )}

              ${
                oferta.precioAntes
                  ? `
                    <span class="old-price">

                      $${Number(
                        oferta.precioAntes
                      ).toLocaleString(
                        "es-MX"
                      )}

                    </span>
                  `
                  : ""
              }

            </div>

          </div>

        `;


        contenedor.appendChild(
          enlace
        );

      });


  } catch(error) {

    console.error(
      "Error ofertas:",
      error
    );

  }

}


/* =========================================
   CUPONES
========================================= */

async function cargarCupones() {

  try {

    const q =
      query(
        collection(
          db,
          "cupones"
        ),
        where(
          "activo",
          "==",
          true
        ),
        orderBy("orden")
      );


    const resultado =
      await getDocs(q);


    cupones = [];


    resultado.forEach(
      documento => {

        cupones.push({

          id:
            documento.id,

          ...documento.data()

        });

      }
    );


    mostrarCupones();


  } catch(error) {

    console.error(
      "Error cupones:",
      error
    );

  }

}


/* =========================================
   MOSTRAR CUPONES
========================================= */

function mostrarCupones() {

  const contenedor =
    $("coupons");

  contenedor.innerHTML = "";


  const filtrados =
    cupones.filter(
      cupon =>
        (
          cupon.categoria ||
          "relampagos"
        ) ===
        categoriaActual
    );


  filtrados.forEach(
    cupon => {

      const tarjeta =
        document.createElement(
          "article"
        );


      tarjeta.className =
        "coupon-card";


      tarjeta.innerHTML = `

        <span class="coupon-label">

          ${escapar(
            cupon.etiqueta ||
            "CUPÓN"
          )}

        </span>


        <span class="coupon-status">

          ● ACTIVO

        </span>


        <div class="coupon-discount">

          ${escapar(
            cupon.descuento ||
            ""
          )}

        </div>


        <div class="coupon-title">

          ${escapar(
            cupon.titulo ||
            "Descuento especial"
          )}

        </div>


        <div class="coupon-info">

          ${
            cupon.minimo
              ? `
                Compra mínima
                $${Number(
                  cupon.minimo
                ).toLocaleString(
                  "es-MX"
                )}
              `
              : ""
          }

          ${
            cupon.maximo
              ? `
                · Máximo
                $${Number(
                  cupon.maximo
                ).toLocaleString(
                  "es-MX"
                )}
              `
              : ""
          }

        </div>


        <button
          class="copy-coupon">

          COPIAR CUPÓN

        </button>

      `;


      tarjeta
        .querySelector(
          ".copy-coupon"
        )
        .addEventListener(
          "click",
          () =>
            copiarCupon(cupon)
        );


      contenedor.appendChild(
        tarjeta
      );

    }
  );

}


/* =========================================
   COPIAR CUPÓN
========================================= */

async function copiarCupon(cupon) {

  try {

    /* COPIAR */

    await navigator.clipboard.writeText(
      cupon.codigo || ""
    );


    /* IDENTIFICADOR */

    const visitante =
      obtenerVisitanteId();

    const dia =
      fechaHoy();


    /*
      Una copia por visitante,
      cupón y día.
    */

    const copiaId =
      `${visitante}_${cupon.id}_${dia}`;


    const referencia =
      doc(
        db,
        "copias",
        copiaId
      );


    const existente =
      await getDoc(
        referencia
      );


    if (!existente.exists()) {

      await setDoc(
        referencia,
        {

          visitanteId:
            visitante,

          cuponId:
            cupon.id,

          dia:
            dia,

          fecha:
            Date.now()

        }
      );


      /*
        Incrementa contador
        del cupón.
      */

      await updateDoc(
        doc(
          db,
          "cupones",
          cupon.id
        ),
        {

          copias:
            increment(1)

        }
      );

    }


    mostrarToast(
      "✅ Cupón copiado. Abriendo Mercado Libre..."
    );


    /*
      Esperamos un poco para
      mostrar el mensaje.
    */

    setTimeout(
      () => {

        const enlace =
          cupon.linkAfiliado ||
          cupon.link ||
          "https://www.mercadolibre.com.mx";


        window.location.href =
          enlace;

      },
      500
    );


  } catch(error) {

    console.error(
      "Error copiando cupón:",
      error
    );


    /*
      Aunque clipboard falle,
      intentamos abrir el enlace.
    */

    const enlace =
      cupon.linkAfiliado ||
      cupon.link ||
      "https://www.mercadolibre.com.mx";


    window.location.href =
      enlace;

  }

}


/* =========================================
   MERCADO PAGO
========================================= */

async function cargarMercadoPago() {

  try {

    const referencia =
      doc(
        db,
        "configuracion",
        "mercadopago"
      );


    const resultado =
      await getDoc(
        referencia
      );


    if (!resultado.exists()) {

      return;

    }


    const datos =
      resultado.data();


    if (datos.texto) {

      $("mpTitle")
        .textContent =
        datos.texto;

    }


    if (datos.link) {

      $("mpButton")
        .href =
        datos.link;

    }

  } catch(error) {

    console.error(
      "Error Mercado Pago:",
      error
    );

  }

}


/* =========================================
   TOAST
========================================= */

function mostrarToast(
  mensaje
) {

  const toast =
    $("toast");


  toast.textContent =
    mensaje;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2200
  );

}


/* =========================================
   TABS
========================================= */

document
  .querySelectorAll(
    ".coupon-tab"
  )
  .forEach(
    boton => {

      boton.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".coupon-tab"
            )
            .forEach(
              b =>
                b.classList.remove(
                  "active"
                )
            );


          boton.classList.add(
            "active"
          );


          categoriaActual =
            boton.dataset.category;


          mostrarCupones();

        }
      );

    }
  );


/* =========================================
   REFRESH
========================================= */

$("refreshBtn")
  .addEventListener(
    "click",
    () =>
      location.reload()
  );


/* =========================================
   CARGAR TODO
========================================= */

async function iniciar() {

  await registrarVisita();

  await Promise.all([

    cargarCategorias(),

    cargarOfertas(),

    cargarCupones(),

    cargarMercadoPago()

  ]);

}


iniciar();
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
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


const auth =
  getAuth(app);


const db =
  getFirestore(app);


const $ =
  id => document.getElementById(id);


let editando = null;

let chart;


/* =========================================
   UTILIDADES
========================================= */

function fechaHoy() {

  const d =
    new Date();

  return [

    d.getFullYear(),

    String(
      d.getMonth() + 1
    ).padStart(2,"0"),

    String(
      d.getDate()
    ).padStart(2,"0")

  ].join("-");

}


function toast(mensaje) {

  const t =
    $("toast");

  t.textContent =
    mensaje;

  t.classList.add(
    "show"
  );

  setTimeout(
    () =>
      t.classList.remove(
        "show"
      ),
    2200
  );

}


/* =========================================
   LOGIN
========================================= */

$("loginBtn")
  .addEventListener(
    "click",
    async () => {

      try {

        await signInWithEmailAndPassword(

          auth,

          $("email").value,

          $("password").value

        );

      } catch(error) {

        $("loginError")
          .textContent =
          "Correo o contraseña incorrectos.";

      }

    }
  );


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
  auth,
  usuario => {

    if (usuario) {

      $("loginBox")
        .classList
        .add("hidden");


      $("dashboard")
        .classList
        .remove("hidden");


      $("logoutBtn")
        .classList
        .remove("hidden");


      cargarDashboard();

    }

    else {

      $("loginBox")
        .classList
        .remove("hidden");


      $("dashboard")
        .classList
        .add("hidden");


      $("logoutBtn")
        .classList
        .add("hidden");

    }

  }
);


$("logoutBtn")
  .addEventListener(
    "click",
    () =>
      signOut(auth)
  );


/* =========================================
   CARGAR DOCUMENTOS
========================================= */

async function obtenerColeccion(
  nombre
) {

  const resultado =
    await getDocs(
      query(
        collection(
          db,
          nombre
        ),
        orderBy("orden")
      )
    );


  return resultado.docs.map(
    documento => ({

      id:
        documento.id,

      ...documento.data()

    })
  );

}


/* =========================================
   DASHBOARD
========================================= */

async function cargarDashboard() {

  await Promise.all([

    cargarEstadisticas(),

    cargarCupones(),

    cargarOfertas(),

    cargarCategorias(),

    cargarMercadoPago()

  ]);

}


/* =========================================
   ESTADÍSTICAS
========================================= */

async function cargarEstadisticas() {

  const hoy =
    fechaHoy();


  /* VISITANTES */

  const visitas =
    await getDocs(
      query(
        collection(
          db,
          "visitas"
        ),
        where(
          "dia",
          "==",
          hoy
        )
      )
    );


  $("todayUsers")
    .textContent =
    visitas.size;


  /* COPIAS */

  const copias =
    await getDocs(
      collection(
        db,
        "copias"
      )
    );


  $("totalCopies")
    .textContent =
    copias.size;


  let copiasHoy =
    0;


  const porCupon = {};

  const porDia = {};


  copias.forEach(
    documento => {

      const datos =
        documento.data();


      if (
        datos.dia === hoy
      ) {

        copiasHoy++;

      }


      const cuponId =
        datos.cuponId;


      if (cuponId) {

        porCupon[cuponId] =
          (
            porCupon[cuponId] ||
            0
          ) + 1;

      }


      const dia =
        datos.dia;


      if (dia) {

        porDia[dia] =
          (
            porDia[dia] ||
            0
          ) + 1;

      }

    }
  );


  $("todayCopies")
    .textContent =
    copiasHoy;


  /* CUPÓN MÁS COPIADO */

  const ranking =
    Object.entries(
      porCupon
    )
    .sort(
      (a,b) =>
        b[1] - a[1]
    );


  if (
    ranking.length
  ) {

    const cupon =
      await getDoc(
        doc(
          db,
          "cupones",
          ranking[0][0]
        )
      );


    $("topCoupon")
      .textContent =
      cupon.exists()
        ? (
          cupon.data().descuento ||
          cupon.data().titulo ||
          "Cupón"
        )
        : `${ranking[0][1]} copias`;

  }


  /* GRÁFICA */

  const dias =
    Object.keys(
      porDia
    )
    .sort()
    .slice(-14);


  const valores =
    dias.map(
      dia =>
        porDia[dia]
    );


  if (chart) {

    chart.destroy();

  }


  chart =
    new Chart(
      $("clickChart"),
      {

        type:
          "line",

        data: {

          labels:
            dias,

          datasets: [{

            label:
              "Copias",

            data:
              valores,

            tension:
              .35,

            fill:
              true

          }]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false

        }

      }
    );

}


/* =========================================
   CUPONES
========================================= */

async function cargarCupones() {

  const lista =
    await obtenerColeccion(
      "cupones"
    );


  $("couponList")
    .innerHTML =
    "";


  lista.forEach(
    cupon => {

      const fila =
        document.createElement(
          "div"
        );


      fila.className =
        "admin-row";


      fila.innerHTML = `

        <div class="admin-grow">

          <strong>
            ${cupon.titulo || "Cupón"}
          </strong>

          <small>

            ${cupon.descuento || ""}

            ·

            ${cupon.copias || 0}
            copias

          </small>

        </div>


        <div class="admin-actions">

          <button
            data-edit="coupon"
            data-id="${cupon.id}">

            Editar

          </button>


          <button
            class="admin-btn red"
            data-delete="coupon"
            data-id="${cupon.id}">

            Eliminar

          </button>

        </div>

      `;


      $("couponList")
        .appendChild(
          fila
        );

    }
  );


  conectarAcciones();

}


/* =========================================
   OFERTAS
========================================= */

async function cargarOfertas() {

  const lista =
    await obtenerColeccion(
      "ofertas"
    );


  $("offerList")
    .innerHTML =
    "";


  lista.forEach(
    oferta => {

      const fila =
        document.createElement(
          "div"
        );


      fila.className =
        "admin-row";


      fila.innerHTML = `

        <div class="admin-grow">

          <strong>

            ${oferta.titulo ||
              "Oferta"}

          </strong>

          <small>

            $${Number(
              oferta.precioActual || 0
            ).toLocaleString(
              "es-MX"
            )}

          </small>

        </div>


        <div class="admin-actions">

          <button
            data-edit="offer"
            data-id="${oferta.id}">

            Editar

          </button>


          <button
            class="admin-btn red"
            data-delete="offer"
            data-id="${oferta.id}">

            Eliminar

          </button>

        </div>

      `;


      $("offerList")
        .appendChild(
          fila
        );

    }
  );


  conectarAcciones();

}


/* =========================================
   CATEGORÍAS
========================================= */

async function cargarCategorias() {

  const lista =
    await obtenerColeccion(
      "categorias"
    );


  $("categoryList")
    .innerHTML =
    "";


  lista.forEach(
    categoria => {

      const fila =
        document.createElement(
          "div"
        );


      fila.className =
        "admin-row";


      fila.innerHTML = `

        <div class="admin-grow">

          <strong>

            ${categoria.nombre ||
              "Categoría"}

          </strong>

          <small>

            ${categoria.link || ""}

          </small>

        </div>


        <div class="admin-actions">

          <button
            data-edit="category"
            data-id="${categoria.id}">

            Editar

          </button>


          <button
            class="admin-btn red"
            data-delete="category"
            data-id="${categoria.id}">

            Eliminar

          </button>

        </div>

      `;


      $("categoryList")
        .appendChild(
          fila
        );

    }
  );


  conectarAcciones();

}


/* =========================================
   ACCIONES
========================================= */

function conectarAcciones() {

  document
    .querySelectorAll(
      "[data-edit]"
    )
    .forEach(
      boton => {

        boton.onclick =
          () =>
            abrirEditor(
              boton.dataset.edit,
              boton.dataset.id
            );

      }
    );


  document
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(
      boton => {

        boton.onclick =
          () =>
            eliminar(
              boton.dataset.delete,
              boton.dataset.id
            );

      }
    );

}


/* =========================================
   COLECCIÓN
========================================= */

function coleccion(
  tipo
) {

  if (
    tipo === "coupon"
  ) return "cupones";


  if (
    tipo === "offer"
  ) return "ofertas";


  return "categorias";

}


/* =========================================
   EDITOR
========================================= */

async function abrirEditor(
  tipo,
  id = null
) {

  editando = {

    tipo,

    id

  };


  $("modal")
    .classList
    .remove("hidden");


  $("modalTitle")
    .textContent =
    id
      ? "Editar"
      : "Nuevo";


  let html = "";


  if (
    tipo === "coupon"
  ) {

    html = `

      <label class="form-label">

        Título

        <input
          name="titulo"
        >

      </label>


      <label class="form-label">

        Descuento

        <input
          name="descuento"
          placeholder="20% OFF"
        >

      </label>


      <label class="form-label">

        Categoría

        <select name="categoria">

          <option value="relampagos">
            ⚡ Relámpagos
          </option>

          <option value="exclusivos">
            💎 Exclusivos
          </option>

          <option value="bancarios">
            🏦 Bancarios
          </option>

        </select>

      </label>


      <label class="form-label">

        Código

        <input
          name="codigo"
        >

      </label>


      <label class="form-label">

        Enlace afiliado

        <input
          name="linkAfiliado"
        >

      </label>


      <label class="form-label">

        Compra mínima

        <input
          name="minimo"
          type="number"
        >

      </label>


      <label class="form-label">

        Descuento máximo

        <input
          name="maximo"
          type="number"
        >

      </label>


      <label class="form-label">

        Orden

        <input
          name="orden"
          type="number"
          value="1"
        >

      </label>


      <label class="form-label">

        Activo

        <select name="activo">

          <option value="true">
            Sí
          </option>

          <option value="false">
            No
          </option>

        </select>

      </label>

    `;

  }


  if (
    tipo === "offer"
  ) {

    html = `

      <label class="form-label">

        Título

        <input
          name="titulo"
        >

      </label>


      <label class="form-label">

        Imagen URL

        <input
          name="imagen"
        >

      </label>


      <label class="form-label">

        Precio anterior

        <input
          name="precioAntes"
          type="number"
        >

      </label>


      <label class="form-label">

        Precio actual

        <input
          name="precioActual"
          type="number"
        >

      </label>


      <label class="form-label">

        Enlace afiliado

        <input
          name="link"
        >

      </label>


      <label class="form-label">

        Orden

        <input
          name="orden"
          type="number"
          value="1"
        >

      </label>

    `;

  }


  if (
    tipo === "category"
  ) {

    html = `

      <label class="form-label">

        Nombre

        <input
          name="nombre"
        >

      </label>


      <label class="form-label">

        Imagen URL

        <input
          name="imagen"
        >

      </label>


      <label class="form-label">

        Enlace

        <input
          name="link"
        >

      </label>


      <label class="form-label">

        Orden

        <input
          name="orden"
          type="number"
          value="1"
        >

      </label>

    `;

  }


  html += `

    <button
      class="admin-btn yellow"
      type="submit">

      GUARDAR

    </button>

  `;


  $("editForm")
    .innerHTML =
    html;


  if (id) {

    const resultado =
      await getDoc(
        doc(
          db,
          coleccion(tipo),
          id
        )
      );


    if (
      resultado.exists()
    ) {

      const datos =
        resultado.data();


      Object.entries(
        datos
      )
      .forEach(
        ([campo,valor]) => {

          const input =
            document.querySelector(
              `[name="${campo}"]`
            );


          if (input) {

            input.value =
              String(valor);

          }

        }
      );

    }

  }

}


/* =========================================
   GUARDAR
========================================= */

$("editForm")
  .addEventListener(
    "submit",
    async evento => {

      evento.preventDefault();


      const datos =
        new FormData(
          evento.target
        );


      const objeto = {};


      for (
        const [
          campo,
          valor
        ]
        of datos.entries()
      ) {

        if (
          [
            "orden",
            "minimo",
            "maximo",
            "precioAntes",
            "precioActual"
          ].includes(campo)
        ) {

          objeto[campo] =
            valor === ""
              ? 0
              : Number(valor);

        }

        else if (
          campo === "activo"
        ) {

          objeto[campo] =
            valor === "true";

        }

        else {

          objeto[campo] =
            valor;

        }

      }


      objeto.updatedAt =
        Date.now();


      const nombreColeccion =
        coleccion(
          editando.tipo
        );


      if (
        editando.id
      ) {

        await updateDoc(

          doc(
            db,
            nombreColeccion,
            editando.id
          ),

          objeto

        );

      }

      else {

        const nuevoId =
          crypto.randomUUID();


        objeto.createdAt =
          Date.now();


        if (
          editando.tipo ===
          "coupon"
        ) {

          objeto.copias =
            0;

        }


        await setDoc(

          doc(
            db,
            nombreColeccion,
            nuevoId
          ),

          objeto

        );

      }


      cerrarModal();

      await cargarDashboard();

      toast(
        "✅ Guardado correctamente"
      );

    }
  );


/* =========================================
   ELIMINAR
========================================= */

async function eliminar(
  tipo,
  id
) {

  if (
    !confirm(
      "¿Seguro que quieres eliminarlo?"
    )
  ) {

    return;

  }


  await deleteDoc(
    doc(
      db,
      coleccion(tipo),
      id
    )
  );


  await cargarDashboard();


  toast(
    "🗑️ Eliminado"
  );

}


/* =========================================
   NUEVOS
========================================= */

$("newCoupon")
  .onclick =
  () =>
    abrirEditor(
      "coupon"
    );


$("newOffer")
  .onclick =
  () =>
    abrirEditor(
      "offer"
    );


$("newCategory")
  .onclick =
  () =>
    abrirEditor(
      "category"
    );


/* =========================================
   MODAL
========================================= */

$("closeModal")
  .onclick =
  cerrarModal;


function cerrarModal() {

  $("modal")
    .classList
    .add("hidden");

}


/* =========================================
   MERCADO PAGO
========================================= */

async function cargarMercadoPago() {

  const resultado =
    await getDoc(
      doc(
        db,
        "configuracion",
        "mercadopago"
      )
    );


  if (
    resultado.exists()
  ) {

    const datos =
      resultado.data();


    $("mpText")
      .value =
      datos.texto || "";


    $("mpLink")
      .value =
      datos.link || "";

  }

}


$("saveMP")
  .onclick =
  async () => {

    await setDoc(

      doc(
        db,
        "configuracion",
        "mercadopago"
      ),

      {

        texto:
          $("mpText").value,

        link:
          $("mpLink").value,

        updatedAt:
          Date.now()

      },

      {
        merge:true
      }

    );


    toast(
      "💳 Promoción guardada"
    );

  };
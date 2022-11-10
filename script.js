'use strict';

//planning step
///user storeies is the descroiption of the application by user perspective
/// user stories will be devided into features
/// then it will be flowcharted
/// architectired by desiners and pm managers

///classess

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance;
    this.duration = duration;
  }

  _setDesciption() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.desciption = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDesciption();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycleing extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = this.elevationGain;
    this.clacSpeed();
    this._setDesciption();
  }
  clacSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

const run = new Running([37, -127], 3, 24, 123);
const cylce = new Cycleing([37, -127], 27, 95, 523);

////aplication architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnReset = document.querySelector('.form__reset');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];

  constructor() {
    //get user position
    this._getPosition();

    //get data from  storage
    this._getLocalStorage();

    ///attach event listner
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    btnReset.addEventListener('click', this.reset);
  }

  _getPosition() {
    //Using Geolocation  API

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get the position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    //   console.log(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(work => this._rednerWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ' ';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...input) => input.every(e => Number.isFinite(e));
    const allPosotive = (...input) => input.every(e => e > 0);
    // get th form from the input

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout running , create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if the data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPosotive(distance, duration, cadence)
      )
        return alert('Input Error');

      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workout.push(workout);
      console.log('running', workout);
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //check if the data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPosotive(distance, duration)
      )
        return alert('Input Error');

      //add new object to workout array
      workout = new Cycleing([lat, lng], distance, duration, elevation);
      this.#workout.push(workout);
      console.log('cycleing', workout);
    }

    //render workout on list
    this._rednerWorkoutMarker(workout);

    this._renderWorkout(workout);

    ///clear input fields

    this._hideForm();

    //console.log(mapEvent.latlng);

    //set local storage

    this._setLocalStorage();
  }

  _rednerWorkoutMarker(workout) {
    //render workout on map as marker

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : ' 🚴‍♀️'}` + workout.desciption
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.name}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.desciption}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : ' 🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
       </div>
       <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
      </div>
      </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    if (!workoutEl) return;

    const workout = this.#workout.find(el => el.id === workoutEl.dataset.id);
    console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data) return;

    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();

import '../App.css'
import axios from 'axios'
import {useEffect, useReducer, useRef, useState} from "react";
import React from "react";
import {Form} from "react-bootstrap";
import clearIcon from '../icons/clear.svg';
import cloudyIcon from '../icons/cloudy.svg';
import drizzleIcon from '../icons/drizzle.svg';
import foggyIcon from '../icons/foggy.svg';
import rainyIcon from '../icons/rainy.svg';
import snowyIcon from '../icons/snowy.svg';
import thunderIcon from '../icons/thunder.svg';

const formReducer = (state, event) => {
    return {
        ...state,
        [event.name]: event.value
    }
}

/**
    Lähes kaikki sovelluksen toiminta tapahtuu tässä komponentissa:
    Datan hakeminen avoimesta rajapinnasta sanahaulla ja säätietojen tarkastelu.
*/

function App() {

    const [formData, setFormData] = useReducer(formReducer, {})
    const [data, setData] = useState({});
    const [location, setLocation] = useState('');
    const [savedCities, setSavedCities] = useState([0]);
    const [save, setSave] = useState(false);
    const [validator, setValidator] = useState(false);
    const [formValidated, setFormValidated] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notLoggedIn, setNotLoggedIn] = useState(false);
    const formRef = useRef(null);
    const [weatherStatus, setWeatherStatus] = useState('');
    const usernameRef = useRef("");
    const [formErrors, setFormErrors] = useState(false);

    /**
    Säädata käydään hakemassa avoimesta rajapinnasta ja se määritellään käyttämään metrijärjestelmää.
    */
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=895284fb2d2c50a520ea537456963d9c`

    useEffect(() => {
        if (validator) {
            axios.get(url).then((response) => {
                setData(response.data);
                setWeatherStatus(data.weather[0].main);
                console.log(response.data);
            });
            setValidator(false);
        }
        console.log("updated: ", location);
    }, [location, validator])

    /**
    Haku tapahtuu painamalla enteria tai hakupainiketta. Jos haettu paikka löytyy avoimesta rajapinnasta, sen tiedot
    esitetään sovelluksessa. Jos ei löydy, tulee virheilmoitus.
    */
    const searchLocation = (event) => {
        if (event.key === 'Enter' || event.button === 0) {
            axios.get(url)
                .then((response) => {
                    setData(response.data);
                    console.log(response.data);
                }).catch(error => {
                if (error.response.status === 404) {
                    alert("Haulla ei löytynyt tuloksia!");
                }
            });
            if (save && !notLoggedIn) {
                const info = {username: JSON.parse(localStorage.getItem("username")), city: location};
                axios
                    .post("http://localhost:8080/savecity", info)
                    .then(response => {
                        if (response.status === 201) {
                            console.log(response.data);
                        }
                    }).catch(error => {
                    if (error.status === 401) {
                        alert(error.response.data);
                    }
                })
            }
        }
    };
    /**
     * Kaupungin voi tallentaa omaan kokoelmaansa merkkaamalla checkboxin.
     * */
    const handleCheckBoxClick = (event) => {
        if (event.target.checked) {
            setSave(true);
        } else {
            setSave(false);
        }
    }
    /**
    Sovellukseen voidaan rekisteröityä ja kirjautua. Kirjautuneena paikkoja voidaan tallentaa tietokantaan.

    Kirjautuminen toimii myös rekisteröitymisenä: Jos käyttäjällä ei ole vielä tiliä, sellainen luodaan ja siihen
    sisältyy käyttäjänimi ja salasana.

    */
    const handleLogin = (event) => {
        const form = event.currentTarget;
        event.preventDefault();
        if (form.checkValidity() === false) {
            event.stopPropagation();
            setFormValidated(true);
            setFormErrors(true);
        } else {
            setTimeout(() => {
                setSubmitting(false);
                formRef.current.reset();
                usernameRef.current.focus();
                setNotLoggedIn(false);
            }, 1000)
            setSubmitting(true);
            axios
                .post("http://localhost:8080/searchuser", formData)
                .then(res => {
                    if (res.status === 202) {
                        localStorage.setItem('userToken', JSON.stringify(res.data.accessToken));
                        localStorage.setItem('username', JSON.stringify(res.data.username));
                        console.log(localStorage.getItem('username'));
                    } else if (res.status === 203) {
                        alert(res.data);
                    } else if (res.status === 201) {
                        alert(res.data);
                    }
                }).catch(error => {
                alert("Error logging in. Try again.");
            })
            setFormValidated(false);
            setFormErrors(false);
        }
    }
    /**
     * Kirjaudutaan ulos
     */
    const handleLogout = () => {
        localStorage.clear();
        setNotLoggedIn(true);
    }
    /*
    Säätietoihin asetetaan ikoni sen mukaan millainen sää etsityssä kohteessa on.
    */
    const setIcon = () => {
       // const weatherState = data.weather[0].main;
      //  console.log("state on:  " + data.weather[0].main);

            switch (data.weather[0].main) {
              case 'Thunder':
                return (<img src={thunderIcon} alt="Logo" />)
              case 'Drizzle':
                return (<img src={drizzleIcon} alt="Logo" />)
              case 'Rain':
                return (<img src={rainyIcon} alt="Logo" />)
              case 'Snow':
                return (<img src={snowyIcon} alt="Logo" />)
              case 'Mist':
                return (<img src={foggyIcon} alt="Logo" />)
              case 'Clear':
                return (<img src={clearIcon} alt="Logo" />)
              case 'Clouds':
                return (<img src={cloudyIcon} alt="Logo" />)
              default:
                return null
            }

    }
    /*
    Kaupunki poistetaan käyttäjän kaupugeista ja tietokannasta.
    */
    function removeCity(save_id) {
        axios
            .post("http://localhost:8080/remove", {save_id})
            .then(response => {
                if (response.status === 201) {
                    console.log(response.data);
                    window.location.reload(false);
                }
            }).catch(error => {
            if (error.response.status === 401) {
                alert(error.response.data);
            }
        })
    }

    /*
    Muuttaa FormDatan arvoja aina kun kirjautumiskentän arvot muuttuvat.
     */
    const handleChange = event => {
        setFormData({
            name: event.target.name,
            value: event.target.value,
        });
    }

    /*
    Katsoo, onko käyttäjä kirjautunut sisään.
     */
    const checkIfLoggedIn = () => {
        const token = localStorage.getItem("userToken");
        if (token === null) {
            setNotLoggedIn(true);
            return false;
        }
        const tokenObj = JSON.parse(token);
        console.log("Token: ", tokenObj);
        axios
            .post("http://localhost:8080/verifytoken", {username: JSON.parse(localStorage.getItem("username"))},
                {headers: {authorization: 'Bearer ' + tokenObj}})
            .then(res => {
                if (res.status === 202) {
                    console.log("Token verification successful.");
                    return true;
                }
            }).catch(error => {
            if (error.response.status === 401) {
                console.log("Token null at verifying stage.");
                setNotLoggedIn(true);
                return false;
            } else if (error.response.status === 403) {
                alert("Session expired. Log in again.");
                setNotLoggedIn(true);
                return false;
        }})
    }

    useEffect(() => {
        if (checkIfLoggedIn() === false) {
            return;
        }
        /*
        Kun käyttäjä kirjautuu sisään, sovelluksen näkymään tuodaan hänen omat tietonsa, tässä tapauksessa tallennetut
        kaupungit.
        */
        const userinfo = {username: JSON.parse(localStorage.getItem("username"))};
        axios
            .post("http://localhost:8080/getusercities", userinfo)
            .then(response => {
                if (response.status === 201) {
                    console.log(response.data);
                    setSavedCities(response.data);
                }
            }).catch(error => {
            if (error.response.status === 401) {
                alert(error.response.data);
            }
        })
        console.log(savedCities);
    }, [data, notLoggedIn]);

    return (
        <div className="App">
            <p className="cityheader">Saved cities</p>
            <div className="container">
            <div className="savedCities">
                <table>
                    <tbody>
                    {!notLoggedIn && savedCities.map(city => (
                        <tr className="capitalize" key={"" + city.save_id}>
                            <td className="pointer" onClick={function () {
                                setLocation(() => city.name)
                                setValidator(() => true);
                            }}>{city.name}</td>
                            <td>
                                <button className="pointer" onClick={() => removeCity(city.save_id)}>Remove</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {notLoggedIn &&<p className="citydefault">Log in to see saved cities</p> }
            </div>
            <div className="search-div">
                <div className="search">
                    <input
                        onChange={event => setLocation(event.target.value)}
                        onKeyPress={searchLocation}
                        placeholder='Write a city here...'
                        type="text"/>
                    <button className="searchButton" onClick={searchLocation}> Search</button>
                    {!notLoggedIn &&
                        <div>
                        Save
                        <input className="pointer" type="checkbox" onClick={handleCheckBoxClick}/>
                        </div>
                    }
                </div>


                    <div className="top">
                        <div className="location">
                            <p>{data.name}</p>
                        </div>
                        <div className="temp">
                            {data.main ? <h1>{data.main.temp.toFixed()}°C</h1> : null}
                        </div>
                        <div className="description">
                            {data.weather ? <p>{data.weather[0].main}<br/>{setIcon()}
                            </p> : null}


                        </div>
                    </div>

                    {data.name !== undefined &&
                        <div className="bottom">
                            <div className="feels">
                                <p>Feels like: </p>
                                {data.main ? <p className='bold'>{data.main.feels_like.toFixed()}°c</p> : null}
                            </div>
                            <div className="humidity">
                                <p>Humidity:</p>
                                {data.main ? <p className='bold'>{data.main.humidity}%</p> : null}
                            </div>
                            <div className="wind">
                                <p>Wind speed:</p>{data.wind ?
                                <p className='bold'>{data.wind.speed.toFixed()} m/s</p> : null}
                            </div>
                        </div>
                    }
                </div>


            {notLoggedIn &&
            <div className="login">
                <h3>Login or register</h3>
                <Form noValidate validated={formValidated} ref={formRef} onSubmit={handleLogin} className="loginForm">
                    <Form.Group controlId="username" className="inputgroup">
                        <Form.Label>Username</Form.Label>
                        <Form.Control required type="text" onChange={handleChange} name="username" placeholder="Username" ref={usernameRef}/>
                    </Form.Group>
                    <Form.Group controlId="password" className="inputgroup">
                        <Form.Label>Password</Form.Label>
                        <Form.Control required type="password" onChange={handleChange} name="password" placeholder="Password"/>
                        {formErrors &&
                            <p className="formErrorText">Fill all text fields.</p>
                        }
                    </Form.Group>
                    <button type={"submit"} className="loginBtn">Log in / Register</button>
                    {submitting &&
                        <p>Logging in...</p>
                    }
                </Form>
            </div>}

                {!notLoggedIn && <div className='login'> <button onClick={handleLogout} className="loginBtn">Log out</button> </div>}

        </div>
        </div>
    );
}

export default App;

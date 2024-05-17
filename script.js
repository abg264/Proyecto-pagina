"use strict";
var UserStatus;
(function (UserStatus) {
    UserStatus["LoggedIn"] = "Logged In";
    UserStatus["LoggingIn"] = "Logging In";
    UserStatus["LoggedOut"] = "Logged Out";
    UserStatus["LogInError"] = "Log In Error";
    UserStatus["VerifyingLogIn"] = "Verifying Log In";
})(UserStatus || (UserStatus = {}));
var Default;
(function (Default) {
    Default["PIN"] = "1234";
})(Default || (Default = {}));
var WeatherType;
(function (WeatherType) {
    WeatherType["Cloudy"] = "Cloudy";
    WeatherType["Rainy"] = "Rainy";
    WeatherType["Stormy"] = "Stormy";
    WeatherType["Sunny"] = "Sunny";
})(WeatherType || (WeatherType = {}));
const defaultPosition = () => ({
    left: 0,
    x: 0
});
const N = {
    clamp: (min, value, max) => Math.min(Math.max(min, value), max),
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
};
const T = {
    format: (date) => {
        const hours = T.formatHours(date.getHours()), minutes = date.getMinutes(), seconds = date.getSeconds();
        return `${hours}:${T.formatSegment(minutes)}`;
    },
    formatHours: (hours) => {
        return hours % 12 === 0 ? 12 : hours % 12;
    },
    formatSegment: (segment) => {
        return segment < 10 ? `0${segment}` : segment;
    }
};
const LogInUtility = {
    verify: async (pin) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (pin === Default.PIN) {
                    resolve(true);
                }
                else {
                    reject(`Invalid pin: ${pin}`);
                }
            }, N.rand(300, 700));
        });
    }
};
const useCurrentDateEffect = () => {
    const [date, setDate] = React.useState(new Date());
    React.useEffect(() => {
        const interval = setInterval(() => {
            const update = new Date();
            if (update.getSeconds() !== date.getSeconds()) {
                setDate(update);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [date]);
    return date;
};
const ScrollableComponent = (props) => {
    const ref = React.useRef(null);
    const [state, setStateTo] = React.useState({
        grabbing: false,
        position: defaultPosition()
    });
    const handleOnMouseDown = (e) => {
        setStateTo(Object.assign(Object.assign({}, state), { grabbing: true, position: {
                x: e.clientX,
                left: ref.current.scrollLeft
            } }));
    };
    const handleOnMouseMove = (e) => {
        if (state.grabbing) {
            const left = Math.max(0, state.position.left + (state.position.x - e.clientX));
            ref.current.scrollLeft = left;
        }
    };
    const handleOnMouseUp = () => {
        if (state.grabbing) {
            setStateTo(Object.assign(Object.assign({}, state), { grabbing: false }));
        }
    };
    return (React.createElement("div", { ref: ref, className: classNames("scrollable-component", props.className), id: props.id, onMouseDown: handleOnMouseDown, onMouseMove: handleOnMouseMove, onMouseUp: handleOnMouseUp, onMouseLeave: handleOnMouseUp }, props.children));
};
const WeatherSnap = () => {
    const [temperature] = React.useState(N.rand(10, 30));
    return (React.createElement("span", { className: "weather" },
        React.createElement("i", { className: "weather-type", className: "fa-duotone fa-sun" }),
        React.createElement("span", { className: "weather-temperature-value" }, temperature),
        React.createElement("span", { className: "weather-temperature-unit" }, "\u00B0C")));
};
const Reminder = () => {
    return (React.createElement("div", { className: "reminder" },
        React.createElement("div", { className: "reminder-icon" },
            React.createElement("i", { className: "fa-regular fa-bell" })),
        React.createElement("span", { className: "reminder-text" },
            "Entrega de Proyecto ",
            React.createElement("span", { className: "reminder-time" }, "2PM"))));
};
const Time = () => {
    const date = useCurrentDateEffect();
    return (React.createElement("span", { className: "time" }, T.format(date)));
};
const Info = (props) => {
    return (React.createElement("div", { id: props.id, className: "info" },
        React.createElement(Time, null),
        React.createElement(WeatherSnap, null)));
};
const PinDigit = (props) => {
    const [hidden, setHiddenTo] = React.useState(false);
    React.useEffect(() => {
        if (props.value) {
            const timeout = setTimeout(() => {
                setHiddenTo(true);
            }, 500);
            return () => {
                setHiddenTo(false);
                clearTimeout(timeout);
            };
        }
    }, [props.value]);
    return (React.createElement("div", { className: classNames("app-pin-digit", { focused: props.focused, hidden }) },
        React.createElement("span", { className: "app-pin-digit-value" }, props.value || "")));
};
const Pin = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const [pin, setPinTo] = React.useState("");
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (userStatus === UserStatus.LoggingIn || userStatus === UserStatus.LogInError) {
            ref.current.focus();
        }
        else {
            setPinTo("");
        }
    }, [userStatus]);
    React.useEffect(() => {
        if (pin.length === 4) {
            const verify = async () => {
                try {
                    setUserStatusTo(UserStatus.VerifyingLogIn);
                    if (await LogInUtility.verify(pin)) {
                        setUserStatusTo(UserStatus.LoggedIn);
                    }
                }
                catch (err) {
                    console.error(err);
                    setUserStatusTo(UserStatus.LogInError);
                }
            };
            verify();
        }
        if (userStatus === UserStatus.LogInError) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    }, [pin]);
    const handleOnClick = () => {
        ref.current.focus();
    };
    const handleOnCancel = () => {
        setUserStatusTo(UserStatus.LoggedOut);
    };
    const handleOnChange = (e) => {
        if (e.target.value.length <= 4) {
            setPinTo(e.target.value.toString());
        }
    };
    const getCancelText = () => {
        return (React.createElement("span", { id: "app-pin-cancel-text", onClick: handleOnCancel }, "Cancel"));
    };
    const getErrorText = () => {
        if (userStatus === UserStatus.LogInError) {
            return (React.createElement("span", { id: "app-pin-error-text" }, "Invalid"));
        }
    };
    return (React.createElement("div", { id: "app-pin-wrapper" },
        React.createElement("input", { disabled: userStatus !== UserStatus.LoggingIn && userStatus !== UserStatus.LogInError, id: "app-pin-hidden-input", maxLength: 4, ref: ref, type: "number", value: pin, onChange: handleOnChange }),
        React.createElement("div", { id: "app-pin", onClick: handleOnClick },
            React.createElement(PinDigit, { focused: pin.length === 0, value: pin[0] }),
            React.createElement(PinDigit, { focused: pin.length === 1, value: pin[1] }),
            React.createElement(PinDigit, { focused: pin.length === 2, value: pin[2] }),
            React.createElement(PinDigit, { focused: pin.length === 3, value: pin[3] })),
        React.createElement("h3", { id: "app-pin-label" },
            "Enter PIN (1234) ",
            getErrorText(),
            " ",
            getCancelText())));
};
const MenuSection = (props) => {
    const getContent = () => {
        if (props.scrollable) {
            return (React.createElement(ScrollableComponent, { className: "menu-section-content" }, props.children));
        }
        return (React.createElement("div", { className: "menu-section-content" }, props.children));
    };
    return (React.createElement("div", { id: props.id, className: "menu-section" },
        React.createElement("div", { className: "menu-section-title" },
            React.createElement("i", { className: props.icon }),
            React.createElement("span", { className: "menu-section-title-text" }, props.title)),
        getContent()));
};
const QuickNav = () => {
    const getItems = () => {
        return [{
                id: 1,
                label: "Clima"
            }, {
                id: 2,
                label: "Galeria"
            }, {
                id: 3,
                label: "Apps"
            }, {
                id: 4,
                label: "Novedades"
            }].map((item) => {
            return (React.createElement("div", { key: item.id, className: "quick-nav-item clear-button" },
                React.createElement("span", { className: "quick-nav-item-label" }, item.label)));
        });
    };
    return (React.createElement(ScrollableComponent, { id: "quick-nav" }, getItems()));
};
const Weather = () => {
    const getDays = () => {
        return [{
                id: 1,
                name: "Lunes",
                temperature: N.rand(10, 30),
                weather: WeatherType.Sunny
            }, {
                id: 2,
                name: "Martes",
                temperature: N.rand(10, 30),
                weather: WeatherType.Sunny
            }, {
                id: 3,
                name: "Miercoles",
                temperature: N.rand(18, 30),
                weather: WeatherType.Cloudy
            }, {
                id: 4,
                name: "Jueves",
                temperature: N.rand(10, 30),
                weather: WeatherType.Rainy
            }, {
                id: 5,
                name: "Viernes",
                temperature: N.rand(10, 30),
                weather: WeatherType.Stormy
            }, {
                id: 6,
                name: "Sabado",
                temperature: N.rand(10, 30),
                weather: WeatherType.Sunny
            }, {
                id: 7,
                name: "Domingo",
                temperature: N.rand(10, 30),
                weather: WeatherType.Cloudy
            }].map((day) => {
            const getIcon = () => {
                switch (day.weather) {
                    case WeatherType.Cloudy:
                        return "fa-duotone fa-clouds";
                    case WeatherType.Rainy:
                        return "fa-duotone fa-cloud-drizzle";
                    case WeatherType.Stormy:
                        return "fa-duotone fa-cloud-bolt";
                    case WeatherType.Sunny:
                        return "fa-duotone fa-sun";
                }
            };
            return (React.createElement("div", { key: day.id, className: "day-card" },
                React.createElement("div", { className: "day-card-content" },
                    React.createElement("span", { className: "day-weather-temperature" },
                        day.temperature,
                        React.createElement("span", { className: "day-weather-temperature-unit" }, "\u00B0C")),
                    React.createElement("i", { className: classNames("day-weather-icon", getIcon(), day.weather.toLowerCase()) }),
                    React.createElement("span", { className: "day-name" }, day.name))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-solid fa-sun", id: "weather-section", scrollable: true, title: "¿Como luce haya afuera?" }, getDays()));
};
const Tools = () => {
    const getTools = () => {
        return [{
                icon: "",
                id: 1,
                image: "./atardeceres/galeria_1.jpg",
                label: "",
                name: ""
            }, {
                icon: "",
                id: 2,
                image: "./atardeceres/galeria_2.jpg",
                label: "",
                name: ""
            }, {
                icon: "",
                id: 3,
                image: "./atardeceres/galeria_3.jpg",
                label: "",
                name: ""
            }, {
                icon: "",
                id: 4,
                image: "./atardeceres/galeria_4.jpg",
                label: "",
                name: ""
            }, {
                icon: "",
                id: 5,
                image: "./atardeceres/galeria_5.jpg",
                label: "",
                name: ""
            }, {
                icon: "",
                id: 6,
                image: "./atardeceres/galeria_6.jpg",
                label: "",
                name: ""
            },].map((tool) => {
            const styles = {
                backgroundImage: `url(${tool.image})`
            };
            return (React.createElement("div", { key: tool.id, className: "tool-card" },
                React.createElement("div", { className: "tool-card-background background-image", style: styles }),
                React.createElement("div", { className: "tool-card-content" },
                    React.createElement("div", { className: "tool-card-content-header" },
                        React.createElement("span", { className: "tool-card-label" }, tool.label),
                        React.createElement("span", { className: "tool-card-name" }, tool.name)),
                    React.createElement("i", { className: classNames(tool.icon, "tool-card-icon") }))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-solid fa-toolbox", id: "tools-section", title: "Atardeceres" }, getTools()));
};
const Restaurants = () => {
    const getRestaurants = () => {
        return [{
                desc: "",
                id: 1,
                image: "galeria_1.jpg",
                title: "Atardecer"
            }, {
                desc: "",
                id: 2,
                image: "galeria_2.jpg",
                title: "Bandera"
            }, {
                desc: "",
                id: 3,
                image: "galeria_3.jpg",
                title: "Dia de Muertos"
            }, {
                desc: "",
                id: 4,
                image: "galeria_4.jpg",
                title: "Flor"
            }].map((restaurant) => {
            const styles = {
                backgroundImage: `url(${restaurant.image})`
            };
            return (React.createElement("div", { key: restaurant.id, className: "restaurant-card background-image", style: styles },
                React.createElement("div", { className: "restaurant-card-content" },
                    React.createElement("div", { className: "restaurant-card-content-items" },
                        React.createElement("span", { className: "restaurant-card-title" }, restaurant.title),
                        React.createElement("span", { className: "restaurant-card-desc" }, restaurant.desc)))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-regular fa-pot-food", id: "restaurants-section", title: "Galeria" }, getRestaurants()));
};

/*
var textoActivo = "ballet_video.html";
var URL = "ballet_video.html";
*/

//var enlace_b = document.createElement("a",{ id: "enlace-ballet", className: "ballet", href: "ballet_video.html", target: "_blank"});
//enlace_b = href= "ballet_video.html";


const Movies = () => {
    const getMovies = () => {
        return [{
            /*class: "ballet_enlace",*/

            

                desc: "Es un ballet folklorico de la ciudad de Agua Prieta Sonora",
               /* label: enlace_b*/
                id: 1,
                icon: "logo.jpg",
                image: "baile.jpg"/* + textoActivo.link(link)*/,// (URL)
                title: "Mexico en la Piel" /*+ textoActivo.link(URL)
                //.createElement("a", { href: "https://www.youtube.com/c/Hyperplexed", target: "_blank" })
                /*function Redirect() {
                    window.location.replace("ballet_video.html");
                     }
                     */
                 //image: window.location.replace("");
                 
            }, {
                desc:"",
                id: 2,
                icon: "",
                image: "fondo_galeria.png" /*+ textoActivo.link(link)*/,
                title: "Galeria"
            }, {
                desc: "",
                id: 3,
                icon: "",
                image: "fondo_carrusel.png",
                title: "Carrusel de imagenes"
            }, {
                desc: "",
                id: 4,
                icon: "",
                image: "fondo_galeria_3d.png",
                title: "Galeria 3D"
            }].map((movie) => {
            const styles = {
                backgroundImage: `url(${movie.image})`
            };
            const id = `movie-card-${movie.id}`;
            return (React.createElement("div", { key: movie.id, id: id, className: "movie-card" },
                React.createElement("div", { className: "movie-card-background background-image", style: styles }),
                React.createElement("div", { className: "movie-card-content" },
                    React.createElement("div", { className: "movie-card-info" },
                        React.createElement("span", { className: "movie-card-title" }, movie.title),
                        React.createElement("span", { className: "movie-card-desc" }, movie.desc)),
                    
                        React.createElement("a", { id: "youtube-link", className: "clear-button", href: "./paginas/pagina_principal.html", target: "_blank" },
                        //React.createElement("i", { className: "fa-brands fa-youtube" }),
                        React.createElement("span", null, "Visitar Pagina"))
                    
                    //    React.createElement("i", { className: movie.icon })
                    ))
                
                );
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-solid fa-camera-movie", id: "movies-section", scrollable: true, title: "Novedades" }, getMovies()));
};
const UserStatusButton = (props) => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        setUserStatusTo(props.userStatus);
    };
    return (React.createElement("button", { id: props.id, className: "user-status-button clear-button", disabled: userStatus === props.userStatus, type: "button", onClick: handleOnClick },
        React.createElement("i", { className: props.icon })));
};
const Menu = () => {
    return (React.createElement("div", { id: "app-menu" },
        React.createElement("div", { id: "app-menu-content-wrapper" },
            React.createElement("div", { id: "app-menu-content" },
                React.createElement("div", { id: "app-menu-content-header" },
                    React.createElement("div", { className: "app-menu-content-header-section" },
                        React.createElement(Info, { id: "app-menu-info" }),
                        React.createElement(Reminder, null)),
                    React.createElement("div", { className: "app-menu-content-header-section" },
                        React.createElement(UserStatusButton, { icon: "fa-solid fa-arrow-right-from-arc", id: "sign-out-button", userStatus: UserStatus.LoggedOut }))),
                React.createElement(QuickNav, null),

/*
                React.createElement("a", { id: "youtube-link", className: "clear-button", href: "https://www.youtube.com/c/Hyperplexed", target: "_blank" },
                    React.createElement("i", { className: "fa-brands fa-youtube" }),
                    React.createElement("span", null, "Hyperplexed")),
*/

                React.createElement(Weather, null),
                React.createElement(Restaurants, null),
                React.createElement(Tools, null),
                React.createElement(Movies, null)))));
};

const Background = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        if (userStatus === UserStatus.LoggedOut) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    };
    return (React.createElement("div", { id: "app-background", onClick: handleOnClick },
        React.createElement("div", { id: "app-background-image", className: "background-image" })));
};
const Loading = () => {
    return (React.createElement("div", { id: "app-loading-icon" },
        React.createElement("i", { className: "fa-solid fa-spinner-third" })));
};
const AppContext = React.createContext(null);
const App = () => {
    const [userStatus, setUserStatusTo] = React.useState(UserStatus.LoggedOut);
    const getStatusClass = () => {
        return userStatus.replace(/\s+/g, "-").toLowerCase();
    };
    return (React.createElement(AppContext.Provider, { value: { userStatus, setUserStatusTo } },
        React.createElement("div", { id: "app", className: getStatusClass() },
            React.createElement(Info, { id: "app-info" }),
            React.createElement(Pin, null),
            React.createElement(Menu, null),
            React.createElement(Background, null),
            React.createElement("div", { id: "sign-in-button-wrapper" },
                React.createElement(UserStatusButton, { icon: "fa-solid fa-arrow-right-to-arc", id: "sign-in-button", userStatus: UserStatus.LoggingIn })),
            React.createElement(Loading, null))));
};
ReactDOM.render(React.createElement(App, null), document.getElementById("root"));